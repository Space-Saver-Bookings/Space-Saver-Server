const {Booking} = require('../models/BookingModel');
const {getAllRooms} = require('./roomFunctions');
// --------------------------------------
// ----- MongoDB/MongooseJS functionality

/**
 * Returns an array of raw MongoDB database documents containing bookings associated with user's rooms.
 *
 * @param {string} requestingUserID - The ID of the user making the request.
 * @returns {Array} An array of raw MongoDB database documents representing bookings.
 */
async function getAllBookings(requestingUserID) {
  const userRooms = await getAllRooms(requestingUserID);
  const roomIds = userRooms.map((room) => room._id);
  return await Booking.find({room_id: {$in: roomIds}});
}

/**
 * Returns a single raw MongoDB database document for a specific booking.
 *
 * @param {string} bookingID - The ID of the booking to retrieve.
 * @returns {Object|null} A raw MongoDB database document representing a booking or null if not found.
 */
async function getOneBooking(bookingID) {
  return await Booking.findOne({_id: bookingID});
}

/**
 * Creates a new booking if there are no overlapping bookings for the specified room and time range.
 * Throws an error if an overlap is detected.
 *
 * @param {Object} bookingDetails - Details of the new booking.
 * @returns {Object} The raw MongoDB database document representing the created booking.
 * @throws {Error} An error with a message indicating the overlapping booking if detected.
 */
async function createBooking(bookingDetails) {
  const {room_id, start_time, end_time} = bookingDetails;

  // Check if there is an overlapping booking for the specified room and time range
  const overlappingBooking = await Booking.findOne({
    room_id: room_id,
    $or: [
      {start_time: {$lt: end_time}, end_time: {$gt: start_time}}, // New booking starts before existing ends
      {start_time: {$lt: end_time}, end_time: {$gt: end_time}}, // New booking overlaps with existing booking
      {start_time: {$lt: start_time}, end_time: {$gt: start_time}},
    ],
  });

  if (overlappingBooking) {
    const errorMessage = `Overlapping booking detected for room ${room_id} between ${start_time} and ${end_time}.`;
    throw new Error(errorMessage);
  }

  // No overlapping booking, proceed to create the new booking
  let newBooking = new Booking({
    room_id: bookingDetails.room_id,
    primary_user_id: bookingDetails.primary_user_id,
    invited_user_ids: bookingDetails.invited_user_ids,
    title: bookingDetails.title,
    description: bookingDetails.description,
    start_time: bookingDetails.start_time,
    end_time: bookingDetails.end_time,
  });

  return await newBooking.save();
}

/**
 * Updates an existing booking and returns the updated booking data.
 *
 * @param {Object} bookingDetails - Details for updating the booking.
 * @returns {Object|null} The raw MongoDB database document representing the updated booking or null if not found.
 */
async function updateBooking(bookingDetails) {
  // Find booking, update it, return the updated booking data.
  return await Booking.findByIdAndUpdate(
    bookingDetails.bookingID,
    bookingDetails.updatedData,
    {new: true}
  ).exec();
}

/**
 * Deletes an existing booking.
 *
 * @param {string} bookingID - The ID of the booking to delete.
 * @returns {Object|null} The raw MongoDB database document representing the deleted booking or null if not found.
 */
async function deleteBooking(bookingID) {
  return await Booking.findByIdAndDelete(bookingID).exec();
}

/**
 * Removes undefined properties from an object.
 *
 * @param {Object} obj - The object to filter.
 * @returns {Object} A new object with undefined properties removed.
 */
function filterUndefinedProperties(obj) {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== undefined)
  );
}

/**
 * Validates whether a room belongs to a user.
 *
 * @param {string} roomID - The ID of the room to validate.
 * @param {string} requestingUserID - The ID of the user making the request.
 * @returns {boolean} True if the room belongs to the user, false otherwise.
 */
async function validateRoomBelongsToUser(roomID, requestingUserID) {
  try {
    const userRooms = await getAllRooms(requestingUserID);
    const userRoomIds = userRooms.map((room) => room._id.toString()); // Convert to strings for comparison

    if (!userRoomIds.includes(roomID)) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates user permission to access a booking.
 *
 * @param {Object} booking - The booking to validate permission against.
 * @param {string} requestingUserID - The ID of the user making the request.
 * @returns {boolean} True if the user has permission, false otherwise.
 */
const validateUserPermission = (booking, requestingUserID) => {
  if (
    requestingUserID !== booking.primary_user_id._id.toString() &&
    !booking.invited_user_ids
      .map((id) => id.toString())
      .includes(requestingUserID)
  ) {
    return false;
  }
  return true;
};

/**
 * Rounds up a date to the next specified interval.
 *
 * @param {Date} date - The date to round up.
 * @param {number} interval - The interval in minutes.
 * @returns {Date} The rounded-up date.
 */
function roundUpToInterval(date, interval) {
  const roundedDate = new Date(date);
  roundedDate.setMilliseconds(0);
  const minutes = roundedDate.getMinutes();
  const remainder = minutes % interval;
  if (remainder !== 0) {
    roundedDate.setMinutes(minutes + interval - remainder);
  }
  return roundedDate;
}

/**
 * Generates time slots within a given date range and interval.
 *
 * @param {Date} startTime - The start of the date range.
 * @param {Date} endTime - The end of the date range.
 * @param {number} interval - The interval in minutes.
 * @returns {Array} An array of time slots, each represented by an object with `available_start_time` and `available_end_time`.
 */
function generateTimeSlots(startTime, endTime, interval) {
  const timeSlots = [];
  let currentTime = roundUpToInterval(new Date(startTime), interval);

  while (currentTime < endTime) {
    const availableStartTime = new Date(currentTime);
    const availableEndTime = new Date(currentTime.getTime() + interval * 60000); // Convert interval to milliseconds
    timeSlots.push({
      available_start_time: availableStartTime,
      available_end_time: availableEndTime,
    });
    currentTime = new Date(availableEndTime); // Set current time to the end time for the next iteration
  }

  return timeSlots;
}

// --------------------------------------
// ----- Exports

module.exports = {
  getAllBookings,
  getOneBooking,
  createBooking,
  updateBooking,
  deleteBooking,
  filterUndefinedProperties,
  validateRoomBelongsToUser,
  validateUserPermission,
  roundUpToInterval,
  generateTimeSlots,
};
