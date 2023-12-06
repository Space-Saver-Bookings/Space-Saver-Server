const { Booking } = require("../models/BookingModel");

// --------------------------------------
// ----- MongoDB/MongooseJS functionality

// Returns an array of raw MongoDB database documents.
async function getAllBookings() {
  return await Booking.find({});
}
// Returns an array of raw MongoDB database documents.
async function getOneBooking(bookingID) {
  return await Booking.findOne({_id: request.params.bookingID});
}

async function createBooking(bookingDetails) {
  // Create new booking based on bookingDetails data
  let newBooking = new Booking({
    booking_id: userDetails.booking_id,
    name: userDetails.name,
    description: userDetails.description,
      capacity: userDetails.capacity,
  });

  // And save it to DB
  return await newBooking.save();
}

async function updateBooking(bookingDetails) {
  // Find booking, update it, return the updated booking data.
  return await Booking.findByIdAndUpdate(
    bookingDetails.bookingID,
    bookingDetails.updatedData,
    {returnDocument: 'after'}
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

// --------------------------------------
// ----- Exports

module.exports = {
  getAllBookings,
  getOneBooking,
  createBooking,
  updateBooking,
  deleteBooking,
  filterUndefinedProperties,
};
