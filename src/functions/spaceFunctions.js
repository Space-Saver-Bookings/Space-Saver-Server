const {Space} = require('../models/SpaceModel');
// --------------------------------------
// ----- MongoDB/MongooseJS functionality

async function getAllSpaces(requestingUserID) {
  let spaces = await Space.find({
    $or: [{user_ids: requestingUserID}, {admin_id: requestingUserID}],
  });

  return spaces;
}

// Returns an array of raw MongoDB database documents.
async function getOneSpace(spaceID) {
  return await Space.findOne({_id: spaceID});
}

async function createSpace(spaceDetails) {
  // Create new space based on spaceDetails data
  let newSpace = new Space({
    admin_id: spaceDetails.admin_id,
    user_ids: spaceDetails.user_ids,
    name: spaceDetails.name,
    description: spaceDetails.description,
    invite_code: spaceDetails.invite_code,
    capacity: spaceDetails.capacity,
  });

  // And save it to DB
  return await newSpace.save();
}

async function updateSpace(spaceDetails) {
  // Find space, update it, return the updated space data.
  return await Space.findByIdAndUpdate(
    spaceDetails.spaceID,
    spaceDetails.updatedData,
    {new: true}
  ).exec();
}

async function deleteSpace(spaceID) {
  return await Space.findByIdAndDelete(spaceID).exec();
}

function filterUndefinedProperties(obj) {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== undefined)
  );
}

async function generateAccessCode() {
  const characters =
    '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

  while (true) {
    let accessCode = '';

    for (let i = 0; i < 5; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      accessCode += characters[randomIndex];
    }

    // Check if the generated code already exists in the database
    const existingSpace = await Space.findOne({
      invite_code: accessCode,
    });

    if (!existingSpace) {
      return accessCode; // Return the code if it's unique
    }
    // Otherwise, generate a new code and repeat the loop
  }
}

// --------------------------------------
// ----- Exports

module.exports = {
  getAllSpaces,
  getOneSpace,
  createSpace,
  updateSpace,
  deleteSpace,
  filterUndefinedProperties,
  generateAccessCode,
};
