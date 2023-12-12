const {verifyUserJWT} = require('../functions/userFunctions');
const {User} = require('../models/UserModel');

// Make sure the JWT available in the headers is valid,
// and refresh it to keep the JWT usable for longer.
const verifyJwtHeader = async (request, response, next) => {
  try {
    let rawJwtHeader = request.headers.jwt;

    // Assuming verifyUserJWT is a function that verifies and refreshes the JWT
    let jwtRefresh = await verifyUserJWT(rawJwtHeader);

    request.headers.jwt = jwtRefresh;

    next();
  } catch (error) {
    // Handle JWT verification errors
    response.status(401).json({
      error: 'Invalid JWT',
    });
  }
};

// handleErrors middleware
const handleErrors = (error, request, response, next) => {
  console.error('Unhandled error:', error);

  // Handle and respond to the client appropriately
  if (response.headersSent) {
    return next(error); // Pass the error to the next middleware in case headers are already sent
  }

  response.status(500).json({
    error: 'Internal Server Error',
    message: error.message, // Use error.message directly
  });
};

// Validate user email uniqueness
const uniqueEmailCheck = async (request, response, next) => {
  let isEmailInUse = await User.exists({email: request.body.email}).exec();
  if (isEmailInUse) {
    next(new Error('An account with this email address already exists.'));
  } else {
    next();
  }
};

module.exports = {
  verifyJwtHeader,
  handleErrors,
  uniqueEmailCheck,
};
