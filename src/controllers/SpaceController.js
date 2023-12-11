// import Express library
const express = require('express');

const {Space} = require('../models/SpaceModel');
const {verifyJwtHeader} = require('../middleware/sharedMiddleware');

// make an instance of a Router
const router = express.Router();

const {
  getAllSpaces,
  getOneSpace,
  createSpace,
  updateSpace,
  deleteSpace,
  filterUndefinedProperties,
  generateAccessCode,
} = require('../functions/spaceFunctions');

const {getUserIdFromJwt} = require('../functions/userFunctions');
const {NONAME} = require('dns');

/**
 * Route for listing all spaces.
 *
 * @name GET /spaces
 * @function
 * @memberof module:express.router
 * @param {Object} request - Express request object.
 * @param {Object} response - Express response object.
 * @returns {Object} JSON response with space count and list of spaces.
 */
router.get('/', verifyJwtHeader, async (request, response) => {
  let allSpaces = await getAllSpaces();
  console.log(allSpaces);

  response.json({
    spaceCount: allSpaces.length,
    spaces: allSpaces,
  });
});

/**
 * Route for showing a specific space.
 *
 * @name GET /spaces/:spaceID
 * @function
 * @memberof module:express.router
 * @param {Object} request - Express request object.
 * @param {Object} response - Express response object.
 * @returns {Object} JSON response with the details of the specified space.
 */
router.get('/:spaceID', verifyJwtHeader, async (request, response) => {
  try {
    const space = await Space.findOne({_id: request.params.spaceID});
    if (!space) {
      return response.status(404).json({message: 'Space not found'});
    }
    return response.json(space);
  } catch (error) {
    console.error('Error:', error);
    return response.status(500).json({error: 'Internal server error'});
  }
});

// Create a new space
router.post('/', verifyJwtHeader, async (request, response) => {
  const requestingUserID = await getUserIdFromJwt(request.headers.jwt);
  const invite_code = await generateAccessCode();

  const user_ids = [requestingUserID, ...request.body.user_ids];

  let newSpaceDoc = null;

  const spaceDetails = {
    admin_id: requestingUserID,
    user_ids: user_ids,
    name: request.body.name,
    description: request.body.description,
    invite_code: invite_code,
    capacity: request.body.capacity,
  };
  try {
    newSpaceDoc = await createSpace(spaceDetails);
  } catch (error) {
    response.json({error: error.reason});
  }

  response.status(201).json({
    space: newSpaceDoc,
  });
});

/**
 * Route for updating a space's details.
 *
 * @name PUT /spaces/:spaceID
 * @function
 * @memberof module:express.router
 * @param {Object} request - Express request object.
 * @param {Object} response - Express response object.
 * @returns {Object} JSON response with the updated space details.
 */
router.put('/:spaceID', verifyJwtHeader, async (request, response) => {
  try {
    const {admin_id, user_ids, name, description, capacity} = request.body;

    const spaceDetails = {
      spaceID: request.params.spaceID,
      updatedData: filterUndefinedProperties({
        admin_id,
        user_ids,
        name,
        description,
        capacity,
      }),
    };
    const updatedSpace = await updateSpace(spaceDetails);

    if (!updatedSpace) {
      return response.status(404).json({message: 'Space not found'});
    }

    return response.json(updatedSpace);
  } catch (error) {
    console.error('Error:', error);
    return response.status(500).json({error: 'Internal server error', reason: `${error.reason}`});
  }
});

/**
 * Route for deleting a space.
 * Will only delete the space if the requester is the spaceID.
 *
 * @name DELETE /spaces/:spaceID
 * @function
 * @memberof module:express.router
 * @param {Object} request - Express request object.
 * @param {Object} response - Express response object.
 * @returns {Object} JSON response indicating success or failure of the deletion.
 */
router.delete('/:spaceID', verifyJwtHeader, async (request, response) => {
  try {
    const requestingUserID = await getUserIdFromJwt(request.headers.jwt);
    const targetSpaceID = request.params.spaceID;
    let space = null;

    try {
      space = await Space.findOne({_id: request.params.spaceID});
      if (!space) {
        return response.status(404).json({message: 'Space not found'});
      }
    } catch (error) {
      console.error('Error:', error);
      return response
        .status(500)
        .json({error: `Internal server error.`, reason: `${error.reason}`});
    }
    // Check if the space making the request is the same as the space whose data is being deleted
    if (requestingUserID !== space.admin_id.toString()) {
      return response.status(403).json({
        error: 'Unauthorized. You can only delete the Space you are admin of',
      });
    }

    // Proceed with the delete operation
    const deletedSpace = await deleteSpace(targetSpaceID);

    return response.json({message: 'Space deleted successfully'});
  } catch (error) {
    console.error('Error:', error);
    return response.status(500).json({error: 'Internal server error', reason: `${error.reason}`});
  }
});

module.exports = router;
