// import Express library
const express = require('express');

const {Room} = require('../models/RoomModel');
const {
  verifyJwtHeader,
  handleErrors,
} = require('../middleware/sharedMiddleware');

// make an instance of a Router
const router = express.Router();

const {
  getAllRooms,
  getOneRoom,
  createRoom,
  updateRoom,
  deleteRoom,
  filterUndefinedProperties,
  isRequestingUserAdmin,
} = require('../functions/roomFunctions');
const {getOneSpace} = require('../functions/spaceFunctions');
const {getUserIdFromJwt} = require('../functions/userFunctions');
const {filterRoomsMiddleware} = require('../middleware/filterMiddleware');

// List all rooms, optionally filtered by space_id
router.get(
  '/',
  verifyJwtHeader,
  filterRoomsMiddleware,
  async (request, response, next) => {
    try {
      const requestingUserId = await getUserIdFromJwt(request.headers.jwt);

      let allRooms = null;

      allRooms = await getAllRooms(requestingUserId);

      response.json({
        roomCount: allRooms.length,
        rooms: allRooms,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Show a specific room
router.get(
  '/:roomId',
  verifyJwtHeader,
  filterRoomsMiddleware,
  async (request, response, next) => {
    try {
      const room = await Room.findOne({_id: request.params.roomId}).populate(
        'space_id'
      );
      if (!room) {
        return response.status(404).json({message: 'Room not found'});
      }
      return response.json(room);
    } catch (error) {
      next(error);
    }
  }
);

// Create a new room
router.post('/', verifyJwtHeader, async (request, response, next) => {
  try {
    if (!(await isRequestingUserAdmin(request))) {
      return response.status(403).json({
        error: `Unauthorised. User is not administrator for space: ${request.body.space_id}`,
      });
    }

    let newRoomDoc = null;

    const roomDetails = {
      space_id: request.body.space_id,
      name: request.body.name,
      description: request.body.description,
      capacity: request.body.capacity,
    };

    newRoomDoc = await createRoom(roomDetails);

    // Populate space_id fields before sending the response
    await Room.populate(newRoomDoc, {path: 'space_id'});

    response.status(201).json({
      room: newRoomDoc,
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:roomId', verifyJwtHeader, async (request, response, next) => {
  try {
    if (!(await isRequestingUserAdmin(request))) {
      return response.status(403).json({
        error: `Unauthorised. User is not administrator for room: ${request.params.roomId}`,
      });
    }

    const {space_id, name, description, capacity} = request.body;

    const roomDetails = {
      roomId: request.params.roomId,
      updatedData: filterUndefinedProperties({
        space_id,
        name,
        description,
        capacity,
      }),
    };
    const updatedRoom = await updateRoom(roomDetails);

    return response.json(updatedRoom);
  } catch (error) {
    next(error);
  }
});

router.delete('/:roomId', verifyJwtHeader, async (request, response) => {
  const targetRoomId = request.params.roomId;
  try {
    if (!(await isRequestingUserAdmin(request))) {
      return response.status(403).json({
        error: `Unauthorised. User is not administrator for room: ${targetRoomId}`,
      });
    }

    // Proceed with the delete operation
    const deletedRoom = await deleteRoom(targetRoomId);

    return response.json({
      message: 'Room deleted successfully',
      room: deletedRoom,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
