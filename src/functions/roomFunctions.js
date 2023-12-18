const {Room} = require('../models/RoomModel');
const {getOneSpace, getAllSpaces} = require('./spaceFunctions');
const {getUserIdFromJwt} = require('./userFunctions');

// --------------------------------------
// ----- MongoDB/MongooseJS functionality

/**
 * Returns an array of raw MongoDB database documents containing rooms associated with user's spaces.
 *
 * @param {string} requestingUserId - The Id of the user making the request.
 * @returns {Array} An array of raw MongoDB database documents representing rooms.
 */
async function getAllRooms(requestingUserId) {
  const userSpaces = await getAllSpaces(requestingUserId);
  const spaceIds = userSpaces.map((space) => space._id);
  return await Room.find({space_id: {$in: spaceIds}});
}

/**
 * Returns a single raw MongoDB database document for a specific room.
 *
 * @param {string} roomId - The Id of the room to retrieve.
 * @returns {Object|null} A raw MongoDB database document representing a room or null if not found.
 */
async function getOneRoom(roomId) {
  return await Room.findOne({_id: roomId}).populate('space_id');
}

/**
 * Creates a new room based on roomDetails data and saves it to the database.
 *
 * @param {Object} roomDetails - Details of the new room.
 * @returns {Object} The raw MongoDB database document representing the created room.
 */
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

/**
 * Updates an existing room and returns the updated room data.
 *
 * @param {Object} roomDetails - Details for updating the room.
 * @returns {Object|null} The raw MongoDB database document representing the updated room or null if not found.
 */
async function updateRoom(roomDetails) {
  // Find room, update it, return the updated room data.
  return await Room.findByIdAndUpdate(
    roomDetails.roomId,
    roomDetails.updatedData,
    {returnDocument: 'after'}
  ).exec();
}

/**
 * Deletes an existing room.
 *
 * @param {string} roomId - The Id of the room to delete.
 * @returns {Object|null} The raw MongoDB database document representing the deleted room or null if not found.
 */
async function deleteRoom(roomId) {
  return await Room.findByIdAndDelete(roomId).exec();
}

/**
 * Removes undefined properties from an object.
 *
 * @param {Object} obj - The object to filter.
 * @returns {Object} A new object with undefined properties removed.
 */
function filterUndefinedProperties(obj) {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== undefined)
  );
}

/**
 * Checks if the requesting user is an admin of the space associated with the request.
 *
 * @param {Object} request - The HTTP request object.
 * @returns {boolean} True if the requesting user is an admin, false otherwise.
 */
async function isRequestingUserAdmin(request) {
  try {
    const requestingUserId = await getUserIdFromJwt(request.headers.jwt);
    let spaceId = null;
    if (request.body.space_id) {
      spaceId = request.body.space_id;
    } else {
      const roomId = request.params.roomId;
      const room = await getOneRoom(roomId);
      spaceId = room.space_id._id.toString();
    }

    const existingSpace = await getOneSpace(spaceId);

    if (
      existingSpace &&
      existingSpace._id.toString() === spaceId &&
      existingSpace.admin_id._id.toString() === requestingUserId
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
