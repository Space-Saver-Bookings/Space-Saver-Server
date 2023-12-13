const {Space} = require('../models/SpaceModel');
// --------------------------------------
// ----- MongoDB/MongooseJS functionality

/**
 * Returns an array of raw MongoDB database documents containing spaces associated with the requesting user.
 *
 * @param {string} requestingUserID - The ID of the user making the request.
 * @returns {Array} An array of raw MongoDB database documents representing spaces.
 */
async function getAllSpaces(requestingUserID) {
  let spaces = await Space.find({
    $or: [{user_ids: requestingUserID}, {admin_id: requestingUserID}],
  });

  return spaces;
}

/**
 * Returns an array of raw MongoDB database documents containing spaces associated with the requesting user.
 *
 * @param {string} requestingUserID - The ID of the user making the request.
 * @returns {Array} An array of raw MongoDB database documents representing spaces.
 */
async function getOneSpace(spaceID) {
  return await Space.findOne({_id: spaceID});
}

/**
 * Creates a new space based on spaceDetails data and saves it to the database.
 *
 * @param {Object} spaceDetails - Details of the new space.
 * @returns {Object} The raw MongoDB database document representing the created space.
 */
async function createSpace(spaceDetails) {
  let newSpace = new Space({
    admin_id: spaceDetails.admin_id,
    user_ids: spaceDetails.user_ids,
    name: spaceDetails.name,
    description: spaceDetails.description,
    invite_code: spaceDetails.invite_code,
    capacity: spaceDetails.capacity,
  });

  return await newSpace.save();
}

/**
 * Updates an existing space and returns the updated space data.
 *
 * @param {Object} spaceDetails - Details for updating the space.
 * @param {string} requestingUserID - The ID of the user making the request.
 * @returns {Object|null} The raw MongoDB database document representing the updated space or null if not found or permission denied.
 */
async function updateSpace(spaceDetails, requestingUserID) {
  // Find space, update it, return the updated space data.
  const space = await Space.findOne({_id: spaceDetails.spaceID});

  // Check if the requesting user is the admin of the space
  if (!space) {
    return null; // Space not found
  }

  if (!space.admin_id.equals(requestingUserID)) {
    return null; // Permission denied
  }

  return await Space.findByIdAndUpdate(
    spaceDetails.spaceID,
    spaceDetails.updatedData,
    {new: true}
  ).exec();
}

/**
 * Deletes an existing space.
 *
 * @param {string} spaceID - The ID of the space to delete.
 * @param {string} requestingUserID - The ID of the user making the request.
 * @returns {Object|null} The raw MongoDB database document representing the deleted space or null if not found or permission denied.
 */
async function deleteSpace(spaceID, requestingUserID) {
  const space = await Space.findOne({_id: spaceID});

  // Check if the requesting user is the admin of the space
  if (!space) {
    return null; // Space not found
  }

  if (!space.admin_id.equals(requestingUserID)) {
    return null; // Permission denied
  }

  // Proceed with the delete operation
  return await Space.findByIdAndDelete(spaceID).exec();
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
 * Generates a unique access code for a space.
 *
 * @returns {string} A unique access code.
 */
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
