// import Express library
const express = require('express');

const {verifyJwtHeader} = require('../middleware/sharedMiddleware');

const router = express.Router();

const {
  getOneBooking,
  createBooking,
  updateBooking,
  deleteBooking,
  filterUndefinedProperties,
  validateRoomBelongsToUser,
  validateUserPermission,
  generateTimeSlots,
  extractBookedTimeSlots,
  calculateAvailableTimeSlots,
  extractQueryParameters,
  mostUsedRoom,
  numberOfRoomsInUse,
  numberOfUsersInRooms,
  generateEmptyTimeSlots
} = require('../functions/bookingFunctions');

const {getUserIdFromJwt} = require('../functions/userFunctions');
const {filterBookingsMiddleware} = require('../middleware/filterMiddleware');
const {Booking} = require('../models/BookingModel');
const {Room} = require('../models/RoomModel');
const { getAllRooms } = require('../functions/roomFunctions');

router.get(
  '/',
  verifyJwtHeader,
  filterBookingsMiddleware,
  async (request, response, next) => {
    try {
      // Access the user Id from the JWT
      const requestingUserId = await getUserIdFromJwt(request.headers.jwt);

      // Access the filtered bookings from the request object after middleware execution
      let allBookings = request.filteredBookings;

      // Extract the boolean query parameters for filtering
      const primaryUserFilter = request.query.primary_user === 'true';
      const invitedUserFilter = request.query.invited_user === 'true';

      // Extract the start_time and end_time query parameters for filtering
      const startTimeFilter = request.query.start_time;
      const endTimeFilter = request.query.end_time;

      // Filter bookings based on start_time
      if (startTimeFilter) {
        const startTime = new Date(startTimeFilter);
        allBookings = allBookings.filter(
          (booking) => new Date(booking.start_time) >= startTime
        );
      }

      // Filter bookings based on end_time
      if (endTimeFilter) {
        const endTime = new Date(endTimeFilter);
        allBookings = allBookings.filter(
          (booking) => new Date(booking.end_time) <= endTime
        );
      }

      // If both filters are false or undefined, show all bookings without further filtering
      if (!primaryUserFilter && !invitedUserFilter) {
        response.json({
          bookingCount: allBookings.length,
          bookings: allBookings,
        });
        return;
      }

      // Initialize an empty array for filtered bookings
      let filteredBookings = [];

      // Filter by primary user
      if (primaryUserFilter) {
        const primaryUserBookings = allBookings.filter((booking) =>
          booking.primary_user_id._id.equals(requestingUserId)
        );
        filteredBookings = filteredBookings.concat(primaryUserBookings);
      }

      response.json({
        bookingCount: filteredBookings.length,
        bookings: filteredBookings,
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
      const requestingUserId = await getUserIdFromJwt(request.headers.jwt);

      // Extract query parameters
      const startTime = request.query.start_time || new Date();
      const endTime = request.query.end_time || null;

      // Extract availability information for each room within the specified time range
      const bookingsPerRoom = {};

      filteredBookings.forEach((booking) => {
        const roomId = booking.room_id._id.toString();

        // Validate that the room belongs to the user
        const isRoomValid = validateRoomBelongsToUser(roomId, requestingUserId);
        if (isRoomValid) {
          // Check if the booking falls within the specified time range
          if (
            (!startTime || new Date(booking.end_time) >= new Date(startTime)) &&
            (!endTime || new Date(booking.start_time) <= new Date(endTime))
          ) {
            if (!bookingsPerRoom[roomId]) {
              bookingsPerRoom[roomId] = [];
            }

            bookingsPerRoom[roomId].push({
              start_time: booking.start_time,
              end_time: booking.end_time,
            });
          }
        }
      });

      // Ensure all unique room_ids are included in the result
      const allRoomIds = Array.from(new Set(filteredBookings.map((booking) => booking.room_id._id.toString())));

      // Create result with all room_ids, including those without bookings
      const formattedResult = allRoomIds.map((roomId) => ({
        room_id: roomId,
        bookings: bookingsPerRoom[roomId] || [],
      }));

      // If there are no bookings, use getAllRooms to get a list of all rooms
      if (formattedResult.length === 0) {
        const allRooms = await getAllRooms(requestingUserId);
        return response.json({ bookingsPerRoom: allRooms.map(room => ({ room_id: room._id, bookings: [] })) });
      }

      response.json({ bookingsPerRoom: formattedResult });
    } catch (error) {
      next(error);
    }
  }
);

// Retrieve available time slots for a room
router.get(
  '/available-time-slots',
  verifyJwtHeader,
  filterBookingsMiddleware,
  async (request, response, next) => {
    try {
      const { filteredBookings } = request;
      const requestingUserId = await getUserIdFromJwt(request.headers.jwt);

      // Extract query parameters
      const { startTime, endTime, interval } = extractQueryParameters(request);

      // Generate all time slots within the specified range and interval
      const allTimeSlots = generateTimeSlots(startTime, endTime, interval);

      // Extract booked time slots
      const bookedTimeSlots = extractBookedTimeSlots(
        filteredBookings,
        requestingUserId
      );

      // Calculate available time slots
      const availableTimeSlots = calculateAvailableTimeSlots(
        allTimeSlots,
        bookedTimeSlots
      );

      // If there are no bookings, use getAllRooms to get a list of all rooms
      if (Object.keys(availableTimeSlots).length === 0) {
        const allRooms = await getAllRooms(requestingUserId);
        const emptyTimeSlots = generateEmptyTimeSlots(allRooms, startTime, endTime, interval);
        const formattedEmptyTimeSlots = Object.keys(emptyTimeSlots).map((roomId) => ({
          room_id: roomId,
          time_slots: emptyTimeSlots[roomId],
        }));
        return response.json({ availableTimeSlots: formattedEmptyTimeSlots, mostUsedRoom: null, numberOfRoomsInUse: 0, numberOfUsersInRooms: 0 });
      }

      // Calculate additional information
      const dateToCheck = new Date(); // You can replace this with the specific date you want to check
      const mostUsedRoomResult = mostUsedRoom(filteredBookings);
      const roomsInUseResult = numberOfRoomsInUse(
        filteredBookings,
        dateToCheck
      );
      const usersInRoomsResult = numberOfUsersInRooms(
        filteredBookings,
        dateToCheck
      );

      // Return the available time slots with room Id and additional information in the response
      const formattedResponse = Object.keys(availableTimeSlots).map(
        (roomId) => ({
          room_id: roomId,
          time_slots: availableTimeSlots[roomId],
        })
      );

      response.json({
        availableTimeSlots: formattedResponse,
        mostUsedRoom: mostUsedRoomResult,
        numberOfRoomsInUse: roomsInUseResult,
        numberOfUsersInRooms: usersInRoomsResult,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get booking by Id
router.get(
  '/:bookingId',
  verifyJwtHeader,
  filterBookingsMiddleware,
  async (request, response, next) => {
    try {
      const filteredBookings = request.filteredBookings;
      const bookingId = request.params.bookingId;

      const booking = filteredBookings.find(
        (booking) => booking._id.toString() === bookingId
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
  const requestingUserId = await getUserIdFromJwt(request.headers.jwt);
  const roomId = request.body.room_id;
  const validation = await validateRoomBelongsToUser(roomId, requestingUserId);

  try {
    if (validation) {
      try {
        const bookingDetails = {
          room_id: roomId,
          primary_user_id: request.body.primary_user_id ?? requestingUserId,
          invited_user_ids: request.body.invited_user_ids || [],
          title: request.body.title,
          description: request.body.description,
          start_time: request.body.start_time,
          end_time: request.body.end_time,
        };

        newBookingDoc = await createBooking(bookingDetails);

        // Populate user ids fields before sending the response
        await Room.populate(newBookingDoc, {
          path: 'room_id',
        });
        // Populate user ids fields before sending the response
        await Booking.populate(newBookingDoc, {
          path: 'primary_user_id invited_user_ids',
        });

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
        .json({message: `Could not find room with id: ${roomId}`});
    }
  } catch (error) {
    next(error);
  }
});

// Update a specific booking
router.put('/:bookingId', verifyJwtHeader, async (request, response, next) => {
  const requestingUserId = await getUserIdFromJwt(request.headers.jwt);

  try {
    const booking = await getOneBooking(request.params.bookingId);

    if (!booking) {
      return response.status(404).json({message: 'Booking not found'});
    }

    if (!validateUserPermission(booking, requestingUserId)) {
      return response.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to update this booking',
      });
    }

    // Validate if the room_id is present in request.body
    if ('room_id' in request.body) {
      const roomId = request.body.room_id;
      // Validate if the room belongs to the user
      const validation = await validateRoomBelongsToUser(
        roomId,
        requestingUserId
      );

      if (!validation) {
        return response
          .status(400)
          .json({message: `Could not find room with id: ${roomId}`});
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
      bookingId: request.params.bookingId,
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

    response.json(updatedBooking);
  } catch (error) {
    next(error);
  }
});

// Delete a specific booking
router.delete(
  '/:bookingId',
  verifyJwtHeader,
  async (request, response, next) => {
    const requestingUserId = await getUserIdFromJwt(request.headers.jwt);

    try {
      const booking = await getOneBooking(request.params.bookingId);

      if (!booking) {
        return response.status(404).json({message: 'Booking not found'});
      }

      if (validateUserPermission(booking, requestingUserId)) {
        const deletedBooking = await deleteBooking(request.params.bookingId);
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
      next(error);
    }
  }
);

module.exports = router;
