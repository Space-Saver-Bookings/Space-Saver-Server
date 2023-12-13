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
  generateTimeSlots,
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

// Retrieve all per-room from bookings associated with user's rooms
router.get(
  '/room',
  verifyJwtHeader,
  filterBookingsMiddleware,
  async (request, response, next) => {
    try {
      const { filteredBookings } = request;
      const requestingUserID = await getUserIdFromJwt(request.headers.jwt);

      // Extract query parameters
      const startTime = request.query.start_time || new Date();
      const endTime = request.query.end_time || null;

      // Extract availability information for each room within the specified time range
      const bookingsPerRoom = {};

      filteredBookings.forEach((booking) => {
        const roomID = booking.room_id._id;

        // Validate that the room belongs to the user
        const isRoomValid = validateRoomBelongsToUser(roomID, requestingUserID);
        if (isRoomValid) {
          // Check if the booking falls within the specified time range
          if (
            (!startTime || new Date(booking.end_time) >= new Date(startTime)) &&
            (!endTime || new Date(booking.start_time) <= new Date(endTime))
          ) {
            if (!bookingsPerRoom[roomID]) {
              bookingsPerRoom[roomID] = [];
            }

            bookingsPerRoom[roomID].push({
              start_time: booking.start_time,
              end_time: booking.end_time,
            });
          }
        }
      });

      // Convert result to the desired format
      const formattedResult = Object.keys(bookingsPerRoom).map((roomID) => ({
        room_id: roomID,
        bookings: bookingsPerRoom[roomID],
      }));

      response.json({ bookingsPerRoom: formattedResult });
    } catch (error) {
      next(error);
    }
  }
);

// Retrieve available time slots for a room
router.get('/available-time-slots', verifyJwtHeader, filterBookingsMiddleware, async (request, response, next) => {
  try {
    const { filteredBookings } = request;
    const requestingUserID = await getUserIdFromJwt(request.headers.jwt); // Assuming you have a user ID in the JWT payload

    // Extract query parameters
    const startTime = new Date(request.query.start_time || new Date());
    const endDateDefault = new Date();
    endDateDefault.setDate(endDateDefault.getDate() + 1);
    const endTime = new Date(request.query.end_time || endDateDefault);
    const interval = parseInt(request.query.interval || 30, 10); // Default to 30 minutes if not provided

    // Generate all time slots within the specified range and interval
    const allTimeSlots = generateTimeSlots(startTime, endTime, interval);

    // Extract booked time slots
    const bookedTimeSlots = {};
    filteredBookings.forEach((booking) => {
      const roomID = booking.room_id._id;

      // Validate that the room belongs to the user
      const isRoomValid = validateRoomBelongsToUser(roomID, requestingUserID);
      if (isRoomValid) {
        if (!bookedTimeSlots[roomID]) {
          bookedTimeSlots[roomID] = [];
        }

        bookedTimeSlots[roomID].push({ start_time: new Date(booking.start_time), end_time: new Date(booking.end_time) });
      }
    });

    // Calculate available time slots by subtracting booked time slots from all time slots
    const availableTimeSlots = {};
    Object.keys(bookedTimeSlots).forEach((roomID) => {
      availableTimeSlots[roomID] = allTimeSlots.filter(
        (slot) => !bookedTimeSlots[roomID].some((booking) => slot.available_start_time < booking.end_time && slot.available_end_time > booking.start_time)
      );
    });

    // Return the available time slots with room ID in the response
    const formattedResponse = Object.keys(availableTimeSlots).map((roomID) => ({
      room_id: roomID,
      time_slots: availableTimeSlots[roomID],
    }));

    response.json({ availableTimeSlots: formattedResponse });
  } catch (error) {
    next(error);
  }
});
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
