const {Space} = require('../models/SpaceModel');
// --------------------------------------
// ----- MongoDB/MongooseJS functionality

/**
 * Returns an array of raw MongoDB database documents containing spaces associated with the requesting user.
 *
 * @param {string} requestingUserId - The Id of the user making the request.
 * @returns {Array} An array of raw MongoDB database documents representing spaces.
 */
async function getAllSpaces(requestingUserId) {
  let spaces = await Space.find({
    $or: [{user_ids: requestingUserId}, {admin_id: requestingUserId}],
  });

  return spaces;
}

/**
 * Returns an array of raw MongoDB database documents containing spaces associated with the requesting user.
 *
 * @param {string} requestingUserId - The Id of the user making the request.
 * @returns {Array} An array of raw MongoDB database documents representing spaces.
 */
async function getOneSpace(spaceId) {
  return await Space.findOne({_id: spaceId});
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
 * @param {string} requestingUserId - The Id of the user making the request.
 * @returns {Object|null} The raw MongoDB database document representing the updated space or null if not found or permission denied.
 */
async function updateSpace(spaceDetails, requestingUserId) {
  try {
    // Find space and check if it exists
    const space = await Space.findOne({ _id: spaceDetails.spaceId });

    // Check if the requesting user is the admin of the space
    if (!space.admin_id.equals(requestingUserId)) {
      return null; // Permission denied
    }

    // Check if the admin is trying to remove themselves from the user_ids array
    if (
      spaceDetails.updatedData.user_ids &&
      !spaceDetails.updatedData.user_ids.includes(requestingUserId)
    ) {
      throw new Error('Cannot remove the admin from the space');
    }

    // Check if the admin is updated and not already in user_ids, add them to the array
    if (
      spaceDetails.updatedData.admin_id &&
      !spaceDetails.updatedData.user_ids.includes(spaceDetails.updatedData.admin_id.toString())
    ) {
      spaceDetails.updatedData.user_ids.push(spaceDetails.updatedData.admin_id.toString());
    }

    // Update space and return the updated space data
    return await Space.findByIdAndUpdate(
      spaceDetails.spaceId,
      spaceDetails.updatedData,
      { new: true }
    ).exec();
  } catch (error) {
    throw new Error(`Error updating space: ${error.message}`);
  }
}

/**
 * Deletes an existing space.
 *
 * @param {string} spaceId - The Id of the space to delete.
 * @param {string} requestingUserId - The Id of the user making the request.
 * @returns {Object|null} The raw MongoDB database document representing the deleted space or null if not found or permission denied.
 */
async function deleteSpace(spaceId, requestingUserId) {
  const space = await Space.findOne({_id: spaceId});

  // Check if the requesting user is the admin of the space
  if (!space) {
    return null; // Space not found
  }

  if (!space.admin_id.equals(requestingUserId)) {
    return null; // Permission denied
  }

  // Proceed with the delete operation
  return await Space.findByIdAndDelete(spaceId).exec();
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
