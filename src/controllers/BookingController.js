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
  validateUserPermission,
} = require('../functions/bookingFunctions');
const {getUserIdFromJwt} = require('../functions/userFunctions');
const {filterBookingsMiddleware} = require('../middleware/filterMiddleware');

// List all bookings
router.get(
  '/',
  verifyJwtHeader,
  filterBookingsMiddleware,
  async (request, response, next) => {
    try {
      // Access the filtered bookings from the request object after middleware execution
      const allBookings = request.filteredBookings;

      response.json({
        bookingCount: allBookings.length,
        bookings: allBookings,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/:bookingID',
  verifyJwtHeader,
  filterBookingsMiddleware,
  async (request, response, next) => {
    try {
      const filteredBookings = request.filteredBookings;
      const bookingID = request.params.bookingID;

      const booking = filteredBookings.find(
        (booking) => booking._id.toString() === bookingID
      );
      if (!booking) {
        return response.status(404).json({message: 'Booking not found'});
      }
      return response.json(booking);
    } catch (error) {
      next(error);
    }
  }
);

// Create a new booking
router.post('/', verifyJwtHeader, async (request, response, next) => {
  const requestingUserID = await getUserIdFromJwt(request.headers.jwt);
  const roomID = request.body.room_id;
  const validation = await validateRoomBelongsToUser(roomID, requestingUserID);

  try {
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
  } catch (error) {
    next(error);
  }
});

// Update a specific booking
router.put('/:bookingID', verifyJwtHeader, async (request, response, next) => {
  const requestingUserID = await getUserIdFromJwt(request.headers.jwt);

  try {
    const booking = await getOneBooking(request.params.bookingID);

    if (!booking) {
      return response.status(404).json({ message: 'Booking not found' });
    }

    if (!validateUserPermission(booking, requestingUserID)) {
      return response.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to update this booking',
      });
    }

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
          .json({ message: `Could not find room with id: ${roomID}` });
      }
    }

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
      return response.status(404).json({ message: 'Booking not found' });
    }

    response.json(updatedBooking);
  } catch (error) {
    next(error)
  }
});


// Delete a specific booking
router.delete('/:bookingID', verifyJwtHeader, async (request, response, next) => {
  const requestingUserID = await getUserIdFromJwt(request.headers.jwt);

  try {
    const booking = await getOneBooking(request.params.bookingID);

    if (!booking) {
      return response.status(404).json({ message: 'Booking not found' });
    }

    if (validateUserPermission(booking, requestingUserID)) {
      const deletedBooking = await deleteBooking(request.params.bookingID);
      response.json({
        message: 'Booking deleted successfully',
        booking: deletedBooking,
      });
    } else {
      response.status(403).json({
        message: 'Unauthorised. You do not have permission.',
      });
    }
  } catch (error) {
    next(error)
  }
});

module.exports = router;
