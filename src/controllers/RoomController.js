// import Express library
const express = require('express');

const { Room } = require('../models/RoomModel');
const {verifyJwtHeader} = require('../middleware/sharedMiddleware');

// make an instance of a Router
const router = express.Router();

const {
  getAllRooms,
  getOneRoom,
  createRoom,
  updateRoom,
  deleteRoom,
  filterUndefinedProperties,
} = require('../functions/roomFunctions');

// List all rooms
router.get('/', verifyJwtHeader, async (request, response) => {
  let allRooms = await getAllRooms();
  console.log(allRooms);

  response.json({
    RoomCount: allRooms.length,
    RoomArray: allRooms,
  });
});

// Show a specific room
router.get('/:roomID', verifyJwtHeader, async (request, response) => {
  try {
    const room = await Room.findOne({_id: request.params.roomID});
    if (!room) {
      return response.status(404).json({message: 'Room not found'});
    }
    return response.json(room);
  } catch (error) {
    console.error('Error:', error);
    return response.status(500).json({error: 'Internal server error'});
  }
});

module.exports = router;
