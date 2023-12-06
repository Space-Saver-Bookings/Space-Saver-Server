// import Express library
const express = require('express');

const {Booking} = require('../models/BookingModel');
const {verifyJwtHeader} = require('../middleware/sharedMiddleware');

// make an instance of a Router
const router = express.Router();

const {
  getAllBookings,
  getOneBooking,
  createBooking,
  updateBooking,
  deleteBooking,
  filterUndefinedProperties,
} = require('../functions/bookingFunctions');

// List all bookings
router.get('/', verifyJwtHeader, async (request, response) => {
  let allBookings = await getAllBookings();
  console.log(allBookings);

  response.json({
    BookingCount: allBookings.length,
    Bookings: allBookings,
  });
});

// Show a specific booking
router.get('/:bookingID', verifyJwtHeader, async (request, response) => {
  try {
    const booking = await Booking.findOne({_id: request.params.bookingID});
    if (!booking) {
      return response.status(404).json({message: 'Booking not found'});
    }
    return response.json(booking);
  } catch (error) {
    console.error('Error:', error);
    return response.status(500).json({error: 'Internal server error'});
  }
});

module.exports = router;
