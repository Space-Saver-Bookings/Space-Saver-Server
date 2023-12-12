const {Booking} = require('../models/BookingModel');
const {getAllRooms} = require('./roomFunctions');
// --------------------------------------
// ----- MongoDB/MongooseJS functionality

// Returns an array of raw MongoDB database documents.
async function getAllBookings(requestingUserID) {
  const userRooms = await getAllRooms(requestingUserID);
  const roomIds = userRooms.map((room) => room._id);
  return await Booking.find({room_id: {$in: roomIds}});
}

// Returns an array of raw MongoDB database documents.
async function getOneBooking(bookingID) {
  return await Booking.findOne({_id: bookingID});
}

async function createBooking(bookingDetails) {
  // Create new booking based on bookingDetails data
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

async function updateBooking(bookingDetails) {
  // Find booking, update it, return the updated booking data.
  return await Booking.findByIdAndUpdate(
    bookingDetails.bookingID,
    bookingDetails.updatedData,
    {new: true}
  ).exec();
}

async function deleteBooking(bookingID) {
  return await Booking.findByIdAndDelete(bookingID).exec();
}

function filterUndefinedProperties(obj) {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== undefined)
  );
}

async function validateRoomBelongsToUser(roomID, requestingUserID) {
  try {
    const userRooms = await getAllRooms(requestingUserID);
    const userRoomIds = userRooms.map((room) => room._id.toString()); // Convert to strings for comparison

    if (!userRoomIds.includes(roomID)) {
      return false
    }
    return true;
  } catch {
    return false
  }
}

const validateUserPermission = (booking, requestingUserID) => {
  if (
    requestingUserID !== booking.primary_user_id.toString() &&
    !booking.invited_user_ids
      .map((id) => id.toString())
      .includes(requestingUserID)
  ) {
    return false;
  }
  return true;
};
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
  validateUserPermission
};
