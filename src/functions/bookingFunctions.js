const {Booking} = require('../models/BookingModel');
const {getAllRooms} = require('./roomFunctions');
// --------------------------------------
// ----- MongoDB/MongooseJS functionality

/**
 * Returns an array of raw MongoDB database documents containing bookings associated with user's rooms.
 *
 * @param {string} requestingUserId - The Id of the user making the request.
 * @returns {Array} An array of raw MongoDB database documents representing bookings.
 */
async function getAllBookings(requestingUserId) {
  const userRooms = await getAllRooms(requestingUserId);
  const roomIds = userRooms.map((room) => room._id);
  return await Booking.find({room_id: {$in: roomIds}});
}

/**
 * Returns a single raw MongoDB database document for a specific booking.
 *
 * @param {string} bookingId - The Id of the booking to retrieve.
 * @returns {Object|null} A raw MongoDB database document representing a booking or null if not found.
 */
async function getOneBooking(bookingId) {
  return await Booking.findOne({_id: bookingId});
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
    bookingDetails.bookingId,
    bookingDetails.updatedData,
    {new: true}
  ).exec();
}

/**
 * Deletes an existing booking.
 *
 * @param {string} bookingId - The Id of the booking to delete.
 * @returns {Object|null} The raw MongoDB database document representing the deleted booking or null if not found.
 */
async function deleteBooking(bookingId) {
  return await Booking.findByIdAndDelete(bookingId).exec();
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
 * @param {string} roomId - The Id of the room to validate.
 * @param {string} requestingUserId - The Id of the user making the request.
 * @returns {boolean} True if the room belongs to the user, false otherwise.
 */
async function validateRoomBelongsToUser(roomId, requestingUserId) {
  try {
    const userRooms = await getAllRooms(requestingUserId);
    const userRoomIds = userRooms.map((room) => room._id.toString()); // Convert to strings for comparison

    if (!userRoomIds.includes(roomId)) {
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
 * @param {string} requestingUserId - The Id of the user making the request.
 * @returns {boolean} True if the user has permission, false otherwise.
 */
const validateUserPermission = (booking, requestingUserId) => {
  if (
    requestingUserId !== booking.primary_user_id._id.toString() &&
    !booking.invited_user_ids
      .map((id) => id.toString())
      .includes(requestingUserId)
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

/**
 * Extracts booked time slots from the filtered bookings.
 *
 * @param {Array} filteredBookings - An array of filtered bookings.
 * @param {string} requestingUserId - The Id of the user making the request.
 * @returns {Object} An object where keys are room Ids and values are arrays of booked time slots.
 */
function extractBookedTimeSlots(filteredBookings, requestingUserId) {
  const bookedTimeSlots = {};
  filteredBookings.forEach((booking) => {
    const roomId = booking.room_id._id;

    // Validate that the room belongs to the user
    const isRoomValid = validateRoomBelongsToUser(roomId, requestingUserId);
    if (isRoomValid) {
      if (!bookedTimeSlots[roomId]) {
        bookedTimeSlots[roomId] = [];
      }

      bookedTimeSlots[roomId].push({
        start_time: new Date(booking.start_time),
        end_time: new Date(booking.end_time),
      });
    }
  });
  return bookedTimeSlots;
}

/**
 * Extracts query parameters from the request object.
 *
 * @param {Object} request - The HTTP request object.
 * @returns {Object} An object containing extracted query parameters.
 */
function extractQueryParameters(request) {
  const startTime = new Date(request.query.start_time || new Date());
  const endDateDefault = new Date();
  endDateDefault.setDate(endDateDefault.getDate() + 1);
  const endTime = new Date(request.query.end_time || endDateDefault);
  const interval = parseInt(request.query.interval || 30, 10); // Default to 30 minutes if not provided

  return {startTime, endTime, interval};
}

/**
 * Calculates available time slots based on all time slots and booked time slots.
 *
 * @param {Array} allTimeSlots - An array of all time slots.
 * @param {Object} bookedTimeSlots - An object where keys are room Ids and values are arrays of booked time slots.
 * @returns {Object} An object where keys are room Ids and values are arrays of available time slots.
 */
function calculateAvailableTimeSlots(allTimeSlots, bookedTimeSlots) {
  const availableTimeSlots = {};
  Object.keys(bookedTimeSlots).forEach((roomId) => {
    availableTimeSlots[roomId] = allTimeSlots.filter(
      (slot) =>
        !bookedTimeSlots[roomId].some(
          (booking) =>
            slot.available_start_time < booking.end_time &&
            slot.available_end_time > booking.start_time
        )
    );
  });
  return availableTimeSlots;
}

/**
 * Identifies the room with the most bookings.
 *
 * @param {Array} bookedTimeSlots - An array of booked time slots.
 * @returns {string} The Id of the room with the most bookings.
 */
function mostUsedRoom(bookedTimeSlots) {
  // Check if the array is empty
  if (bookedTimeSlots.length === 0) {
    return null;
  }

  const bookingsByRoom = bookedTimeSlots.reduce((acc, booking) => {
    const roomId = booking.room_id._id;
    acc[roomId] = (acc[roomId] || 0) + 1;
    return acc;
  }, {});

  const mostUsedRoomId = Object.keys(bookingsByRoom).reduce((a, b) =>
    bookingsByRoom[a] > bookingsByRoom[b] ? a : b
  );

  return mostUsedRoomId;
}

/**
 * Calculates the number of rooms in use at a specific date/time.
 *
 * @param {Array} bookedTimeSlots - An array of booked time slots.
 * @param {Date} date - The date and time to check for room occupancy.
 * @returns {number} The number of rooms in use at the specified date/time.
 */
function numberOfRoomsInUse(bookedTimeSlots, date) {
  const roomsInUse = bookedTimeSlots
    .filter((booking) => {
      const startTime = new Date(booking.start_time);
      const endTime = new Date(booking.end_time);
      return startTime <= date && endTime >= date;
    })
    .map((booking) => booking.room_id.toString())
    .filter((value, index, self) => self.indexOf(value) === index);

  return roomsInUse.length;
}

/**
 * Calculates the number of primary and invited users in rooms at a specific date/time.
 *
 * @param {Array} bookedTimeSlots - An array of booked time slots.
 * @param {Date} date - The date and time to check for user occupancy.
 * @returns {Object} An object with the number of primary users, invited users, and the total number of users.
 */
function numberOfUsersInRooms(bookedTimeSlots, date) {
  const usersInRooms = bookedTimeSlots.reduce(
    (acc, booking) => {
      const startTime = new Date(booking.start_time);
      const endTime = new Date(booking.end_time);
      if (startTime <= date && endTime >= date) {
        acc.primaryUsers.add(booking.primary_user_id.toString());
        booking.invited_user_ids.forEach((userId) =>
          acc.invitedUsers.add(userId.toString())
        );
      }
      return acc;
    },
    {primaryUsers: new Set(), invitedUsers: new Set()}
  );

  return {
    numberOfPrimaryUsers: usersInRooms.primaryUsers.size,
    numberOfInvitedUsers: usersInRooms.invitedUsers.size,
    totalNumberOfUsers:
      usersInRooms.primaryUsers.size + usersInRooms.invitedUsers.size,
  };
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
  extractQueryParameters,
  extractBookedTimeSlots,
  calculateAvailableTimeSlots,
  mostUsedRoom,
  numberOfRoomsInUse,
  numberOfUsersInRooms,
};
