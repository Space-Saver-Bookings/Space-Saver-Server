const { Room } = require("../models/RoomModel");

// --------------------------------------
// ----- MongoDB/MongooseJS functionality

// Returns an array of raw MongoDB database documents.
async function getAllRooms() {
  return await Room.find({});
}
// Returns an array of raw MongoDB database documents.
async function getOneRoom(roomID) {
  return await Room.findOne({_id: request.params.roomID});
}

async function createRoom(roomDetails) {
  // Create new room based on roomDetails data
  let newRoom = new Room({
    room_id: userDetails.room_id,
    name: userDetails.name,
    description: userDetails.description,
      capacity: userDetails.capacity,
  });

  // And save it to DB
  return await newRoom.save();
}

async function updateRoom(roomDetails) {
  // Find room, update it, return the updated room data.
  return await Room.findByIdAndUpdate(
    roomDetails.roomID,
    roomDetails.updatedData,
    {returnDocument: 'after'}
  ).exec();
}

async function deleteRoom(roomID) {
  return await Room.findByIdAndDelete(roomID).exec();
}

function filterUndefinedProperties(obj) {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== undefined)
  );
}

// --------------------------------------
// ----- Exports

module.exports = {
  getAllRooms,
  getOneRoom,
  createRoom,
  updateRoom,
  deleteRoom,
  filterUndefinedProperties,
};
