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
const {filterSpacesMiddleware} = require('../middleware/filterMiddleware');

router.get(
  '/',
  verifyJwtHeader,
  filterSpacesMiddleware,
  async (request, response, next) => {
    try {
      const {filteredSpaces} = request;

      response.json({
        spaceCount: filteredSpaces.length,
        spaces: filteredSpaces,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/:spaceId',
  verifyJwtHeader,
  filterSpacesMiddleware,
  async (request, response, next) => {
    try {
      const {filteredSpaces} = request;

      const space = filteredSpaces.find((space) =>
        space._id.equals(request.params.spaceId)
      );

      if (!space) {
        return response.status(404).json({message: 'Space not found'});
      }

      return response.json(space);
    } catch (error) {
      next(error);
    }
  }
);

// Create a new space
router.post('/', verifyJwtHeader, async (request, response, next) => {
  try {
    const requestingUserId = await getUserIdFromJwt(request.headers.jwt);
    const invite_code = await generateAccessCode();

    const user_ids = [requestingUserId];

    let newSpaceDoc = null;

    const spaceDetails = {
      admin_id: requestingUserId,
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
  } catch (error) {
    next(error);
  }
});

// Add user to space
router.post(
  '/code/:invite_code',
  verifyJwtHeader,
  async (request, response, next) => {
    try {
      const requestingUserId = await getUserIdFromJwt(request.headers.jwt);
      const inviteCode = request.params.invite_code;

      // Find the space with the given invite code
      const space = await Space.findOne({invite_code: inviteCode});

      if (!space) {
        return response
          .status(404)
          .json({message: 'Space not found with the given invite code'});
      }

      // Check if the user is already in the space
      if (space.user_ids.includes(requestingUserId)) {
        return response
          .status(400)
          .json({message: 'User is already part of the space', space: space});
      }

      // Add the user to the space
      space.user_ids.push(requestingUserId);
      await space.save();

      response
        .status(200)
        .json({message: 'User joined space successfully', space: space});
    } catch (error) {
      next(error);
    }
  }
);

router.put('/:spaceId', verifyJwtHeader, async (request, response, next) => {
  try {
    const {admin_id, user_ids, name, description, capacity} = request.body;

    // Check if the requesting user is the admin of the space
    const requestingUserId = await getUserIdFromJwt(request.headers.jwt);

    // If the user is the admin, update the space
    const spaceDetails = {
      spaceId: request.params.spaceId,
      updatedData: filterUndefinedProperties({
        admin_id,
        user_ids,
        name,
        description,
        capacity,
      }),
    };
    const updatedSpace = await updateSpace(spaceDetails, requestingUserId);

    if (!updatedSpace) {
      return response.status(404).json({message: 'Space not found'});
    }

    return response.json(updatedSpace);
  } catch (error) {
    next(error);
  }
});

/**
 * Route for deleting a space.
 * Will only delete the space if the requester is the spaceId.
 *
 * @name DELETE /spaces/:spaceId
 * @function
 * @memberof module:express.router
 * @param {Object} request - Express request object.
 * @param {Object} response - Express response object.
 * @returns {Object} JSON response indicating success or failure of the deletion.
 */
router.delete('/:spaceId', verifyJwtHeader, async (request, response, next) => {
  try {
    const requestingUserId = await getUserIdFromJwt(request.headers.jwt);
    const targetSpaceId = request.params.spaceId;

    // If the user is the admin, proceed with the delete operation
    const deletedSpace = await deleteSpace(targetSpaceId, requestingUserId);

    if (!deletedSpace) {
      return response.status(404).json({message: 'Space not found'});
    }

    return response.json({message: 'Space deleted successfully'});
  } catch (error) {
    next(error);
  }
});

module.exports = router;
