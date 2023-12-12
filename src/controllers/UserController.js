// import Express library
const express = require('express');
const jwt = require('jsonwebtoken');

const {User} = require('../models/UserModel');

// make an instance of a Router
const router = express.Router();

const {
  encryptString,
  decryptString,
  decryptObject,
  validateHashedData,
  generateJWT,
  generateUserJWT,
  verifyUserJWT,
  getUserIdFromJwt,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  filterUndefinedProperties,
} = require('../functions/userFunctions');

const {
  verifyJwtHeader,
  handleErrors,
  uniqueEmailCheck,
} = require('../middleware/sharedMiddleware');
const {filterUsersMiddleware} = require('../middleware/filterMiddleware');

// Sign-up a new user
router.post(
  '/register',
  uniqueEmailCheck,
  handleErrors,
  async (request, response, next) => {
    try {
      const userDetails = {
        first_name: request.body.first_name,
        last_name: request.body.last_name,
        email: request.body.email,
        password: request.body.password,
        post_code: request.body.post_code,
        country: request.body.country,
        position: request.body.position,
      };
      let newUserDoc = await createUser(userDetails);

      response.json({
        user: newUserDoc,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post('/login', async (request, response, next) => {
  try {
    let targetUser = await User.findOne({email: request.body.email}).exec();

    if (!targetUser) {
      return response.status(404).json({message: 'User not found.'});
    }

    if (await validateHashedData(request.body.password, targetUser.password)) {
      let encryptedUserJwt = await generateUserJWT({
        userID: targetUser._id,
        email: targetUser.email,
        password: targetUser.password,
      });
      response.json({jwt: encryptedUserJwt});
    } else {
      response.status(401).json({message: 'Invalid password.'});
    }
  } catch (error) {
    next(error);
  }
});

// Extend a user's JWT validity
router.post('/token-refresh', async (request, response, next) => {
  try {
    let oldToken = request.body.jwt;
    let refreshResult = await verifyUserJWT(oldToken);
    response.json({jwt: refreshResult});
  } catch (error) {
    next(error);
  }
});

// List all users
router.get(
  '/',
  verifyJwtHeader,
  filterUsersMiddleware,
  async (request, response, next) => {
    try {
      const filteredUsers = request.filteredUsers;

      response.json({
        userCount: filteredUsers.length,
        users: filteredUsers,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Show a specific user
router.get(
  '/:userID',
  verifyJwtHeader,
  filterUsersMiddleware,
  async (request, response, next) => {
    try {
      const userIdParam = request.params.userID;
      const filteredUsers = request.filteredUsers;

      // Find the user with the specified ID in the filtered list
      const user = filteredUsers.find((user) => user._id.equals(userIdParam));

      if (!user) {
        return response.status(404).json({message: 'User not found'});
      }
      // Respond with the filtered user
      return response.json(user);
    } catch (error) {
      next(error);
    }
  }
);

// Update a user
router.put('/:userID', handleErrors, async (request, response, next) => {
  try {
    const requestingUserID = await getUserIdFromJwt(request.headers.jwt);

    // Ensure that the user can only update their own account
    if (requestingUserID !== request.params.userID) {
      return response
        .status(403)
        .json({message: 'Unauthorized: You can only update your own account'});
    }

    const {
      first_name,
      last_name,
      email,
      password,
      post_code,
      country,
      position,
    } = request.body;

    const userDetails = {
      userID: request.params.userID,
      updatedData: filterUndefinedProperties({
        first_name,
        last_name,
        email,
        password,
        post_code,
        country,
        position,
      }),
    };

    const updatedUser = await updateUser(userDetails);

    if (!updatedUser) {
      return response.status(404).json({message: 'User not found'});
    }

    return response.json(updatedUser);
  } catch (error) {
    if (error.path === '_id') {
      return response.status(404).json({message: 'User not found'});
    }
    next(error);
  }
});

// Delete user account
// Will only delete user if the requester is the userID
router.delete('/:userID', verifyJwtHeader, async (request, response, next) => {
  try {
    const requestingUserID = await getUserIdFromJwt(request.headers.jwt);
    const targetUserID = request.params.userID;

    // Check if the user making the request is the same as the user whose data is being deleted
    if (requestingUserID !== targetUserID) {
      return response.status(403).json({
        message: 'Unauthorized. You can only delete your own account.',
      });
    }

    // Proceed with the delete operation
    const deletedUser = await deleteUser(targetUserID);

    if (!deletedUser) {
      return response.status(404).json({message: 'User not found'});
    }

    return response.json({message: 'User deleted successfully'});
  } catch (error) {
    if (error.path === '_id') {
      return response.status(404).json({message: 'User not found'});
    }
    next(error);
  }
});

module.exports = router;
