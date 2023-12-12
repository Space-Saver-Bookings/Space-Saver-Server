const { verifyUserJWT } = require("../functions/userFunctions");
const { User } = require("../models/UserModel");

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
  uniqueEmailCheck
}