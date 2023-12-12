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
  validateRoomBelongsToUser,
} = require('../functions/bookingFunctions');
const {getUserIdFromJwt} = require('../functions/userFunctions');
const {getAllRooms} = require('../functions/roomFunctions');


// List all bookings
router.get('/', verifyJwtHeader, async (request, response) => {
  try {
    const requestingUserID = await getUserIdFromJwt(request.headers.jwt);

    const allBookings = await getAllBookings(requestingUserID);

    response.json({
      bookingCount: allBookings.length,
      bookings: allBookings,
    });
  } catch (error) {
    console.error('Error:', error);
    response.status(500).json({error: 'Internal Server Error'});
  }
});

// Show a specific booking
router.get('/:bookingID', verifyJwtHeader, async (request, response) => {
  try {
    const booking = await getOneBooking(request.params.bookingID);
    if (!booking) {
      return response.status(404).json({message: 'Booking not found'});
    }
    return response.json(booking);
  } catch (error) {
    console.error('Error:', error);
    response.status(500).json({error: 'Internal Server Error'});
  }
});

// Create a new booking
router.post('/', verifyJwtHeader, async (request, response) => {
  const requestingUserID = await getUserIdFromJwt(request.headers.jwt);
  const roomID = request.body.room_id;
  const validation = await validateRoomBelongsToUser(roomID, requestingUserID);

  if (validation) {
    try {
      const bookingDetails = {
        room_id: roomID,
        primary_user_id: request.body.primary_user_id ?? requestingUserID,
        invited_user_ids: request.body.invited_user_ids || [],
        title: request.body.title,
        description: request.body.description,
        start_time: request.body.start_time,
        end_time: request.body.end_time,
      };

      newBookingDoc = await createBooking(bookingDetails);

      response.status(201).json({
        booking: newBookingDoc,
      });
    } catch (error) {
      response
        .status(400)
        .json({error: error.message, valueGiven: error.value});
    }
  } else {
    response
      .status(400)
      .json({message: `Could not find room with id: ${roomID}`});
  }
});

// Update a specific booking
router.put('/:bookingID', verifyJwtHeader, async (request, response) => {
  const requestingUserID = await getUserIdFromJwt(request.headers.jwt);

  // Validate if the room_id is present in request.body
  if ('room_id' in request.body) {
    const roomID = request.body.room_id;
    // Validate if the room belongs to the user
    const validation = await validateRoomBelongsToUser(
      roomID,
      requestingUserID
    );

    if (!validation) {
      return response
        .status(400)
        .json({message: `Could not find room with id: ${roomID}`});
    }
  }

  try {
    const {
      room_id,
      primary_user_id,
      invited_user_ids,
      title,
      description,
      start_time,
      end_time,
    } = request.body;
    const roomDetails = {
      bookingID: request.params.bookingID,
      updatedData: filterUndefinedProperties({
        room_id,
        primary_user_id,
        invited_user_ids,
        title,
        description,
        start_time,
        end_time,
      }),
    };
    const updatedBooking = await updateBooking(roomDetails);

    if (!updatedBooking) {
      return response.status(404).json({message: 'Booking not found'});
    }

    response.json(updatedBooking);
  } catch (error) {
    console.error('Error:', error);
    response.status(500).json({error: error.message});
  }
});

// Delete a specific booking
router.delete('/:bookingID', verifyJwtHeader, async (request, response) => {
  const requestingUserID = await getUserIdFromJwt(request.headers.jwt);

  try {
    const booking = await getOneBooking(request.params.bookingID);

    if (!booking) {
      return response.status(404).json({message: 'Booking not found'});
    }

    // Check if the requesting user is the primary_user_id
    if (booking.primary_user_id.equals(requestingUserID)) {
      const deletedBooking = await deleteBooking(request.params.bookingID);
      response.json({
        message: 'Booking deleted successfully',
        booking: deletedBooking,
      });
    } else {
      response.status(403).json({
        message: 'Cannot delete booking. You are not the primary user.',
      });
    }
  } catch (error) {
    console.error('Error:', error);
    response.status(500).json({error: 'Internal Server Error'});
  }
});

module.exports = router;
