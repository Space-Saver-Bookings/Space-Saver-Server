const {Space} = require('../models/SpaceModel');

// --------------------------------------
// ----- MongoDB/MongooseJS functionality

// Returns an array of raw MongoDB database documents.
async function getAllSpaces() {
  return await Space.find({});
}
// Returns an array of raw MongoDB database documents.
async function getOneSpace(spaceID) {
  return await Space.findOne({_id: request.params.spaceID});
}

async function createSpace(spaceDetails) {
  // Create new space based on spaceDetails data
  let newSpace = new Space({
    admin_id: userDetails.admin_id,
    user_ids: userDetails.user_ids,
    name: userDetails.name,
    description: userDetails.description,
    invite_code: userDetails.invite_code,
    capacity: userDetails.capacity,
  });

  // And save it to DB
  return await newSpace.save();
}

async function updateUser(spaceDetails) {
  // Find user, update it, return the updated user data.
  return await Space.findByIdAndUpdate(
    spaceDetails.spaceID,
    spaceDetails.updatedData,
    {returnDocument: 'after'}
  ).exec();
}

async function deleteUser(spaceID) {
  return await Space.findByIdAndDelete(spaceID).exec();
}

function filterUndefinedProperties(obj) {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== undefined)
  );
}

// --------------------------------------
// ----- Exports

module.exports = {
    getAllSpaces,
    getOneSpace,
    createSpace,
    updateUser,
    deleteUser,
    filterUndefinedProperties,
};
