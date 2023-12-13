const {Room} = require('../models/RoomModel');
const {getOneSpace, getAllSpaces} = require('./spaceFunctions');
const {getUserIdFromJwt} = require('./userFunctions');

// --------------------------------------
// ----- MongoDB/MongooseJS functionality

// Returns an array of raw MongoDB database documents.
async function getAllRooms(requestingUserID) {
  const userSpaces = await getAllSpaces(requestingUserID)
  const spaceIds = userSpaces.map(space => space._id)
  return await Room.find({ space_id: { $in: spaceIds } })
}

// Returns an array of raw MongoDB database documents.
async function getOneRoom(roomID) {
  return await Room.findOne({_id: roomID}).populate('space_id');
}

async function createRoom(roomDetails) {
  // Create new room based on roomDetails data
  let newRoom = new Room({
    space_id: roomDetails.space_id,
    name: roomDetails.name,
    description: roomDetails.description,
    capacity: roomDetails.capacity,
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

async function isRequestingUserAdmin(request) {
  try {
    const requestingUserID = await getUserIdFromJwt(request.headers.jwt);
    let spaceID = null
    if (request.body.space_id) {
      spaceID = request.body.space_id;
    } else {
      const roomID = request.params.roomID
      const room = await getOneRoom(roomID)
      spaceID = room.space_id._id.toString()
    }
    
    const existingSpace = await getOneSpace(spaceID);

    if (
      existingSpace &&
      existingSpace._id.toString() === spaceID &&
      existingSpace.admin_id._id.toString() === requestingUserID
    ) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error(error);
    return false;
  }
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
  isRequestingUserAdmin,
};
