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

const { verifyJwtHeader } = require('../middleware/sharedMiddleware');


// Validate user email uniqueness
const uniqueEmailCheck = async (request, response, next) => {
  let isEmailInUse = await User.exists({email: request.body.email}).exec();
  if (isEmailInUse) {
    next(new Error('An account with this email address already exists.'));
  } else {
    next();
  }
};

// If any errors are detected, end the route early
// and respond with the error message
const handleErrors = async (error, request, response, next) => {
  if (error) {
    response.status(500).json({
      error: error.message,
    });
  } else {
    next();
  }
};


// Sign-up a new user
router.post(
  '/register',
  uniqueEmailCheck,
  handleErrors,
  async (request, response) => {
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
  }
);

// Login existing user
router.post('/login', async (request, response) => {
  let targetUser = await User.findOne({email: request.body.email}).exec();
  try {
    if (await validateHashedData(request.body.password, targetUser.password)) {
      let encryptedUserJwt = await generateUserJWT({
        userID: targetUser._id,
        email: targetUser.email,
        password: targetUser.password,
      });
      response.json({jwt: encryptedUserJwt});
    }
  } catch {
    response.status(400).json({message: 'Invalid user details provided.'});
  }
});

// Extend a user's JWT validity
router.post('/token-refresh', async (request, response) => {
  let oldToken = request.body.jwt;
  let refreshResult = await verifyUserJWT(oldToken).catch((error) => {
    return {error: error.message};
  });
  response.json({jwt: refreshResult});
});

// List all users
router.get('/', verifyJwtHeader, async (request, response) => {
  let allUsers = await getAllUsers();

  response.json({
    userCount: allUsers.length,
    users: allUsers,
  });
});

// Show a specific user
router.get('/:userID', verifyJwtHeader, async (request, response) => {
  try {
    const user = await User.findOne({_id: request.params.userID});
    if (!user) {
      return response.status(404).json({message: 'User not found'});
    }
    return response.json(user);
  } catch (error) {
    console.error('Error:', error);
    return response.status(500).json({error: 'Internal server error'});
  }
});

// Update a user
router.put('/:userID', async (request, response) => {
  try {
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
    console.error('Error:', error);
    return response.status(500).json({error: 'Internal server error'});
  }
});

// Delete user account
// Will only delete user if the requester is the userID
router.delete('/:userID', verifyJwtHeader, async (request, response) => {
  try {
    const requestingUserID = await getUserIdFromJwt(request.headers.jwt);
    const targetUserID = request.params.userID;

    // Check if the user making the request is the same as the user whose data is being deleted
    if (requestingUserID !== targetUserID) {
      return response.status(403).json({
        error: 'Unauthorized. You can only delete your own account.',
      });
    }

    // Proceed with the delete operation
    const deletedUser = await deleteUser(targetUserID);

    if (!deletedUser) {
      return response.status(404).json({message: 'User not found'});
    }

    return response.json({message: 'User deleted successfully'});
  } catch (error) {
    console.error('Error:', error);
    return response.status(500).json({error: 'Internal server error'});
  }
});

module.exports = router