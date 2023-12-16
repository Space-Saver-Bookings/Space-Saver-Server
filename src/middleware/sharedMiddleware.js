const {verifyUserJWT} = require('../functions/userFunctions');
const {User} = require('../models/UserModel');

/**
 * Middleware to verify the JWT available in the headers. 
 * If valid, it refreshes the JWT to keep it usable for a longer duration.
 * @param {Object} request - Express request object.
 * @param {Object} response - Express response object.
 * @param {Function} next - Express next middleware function.
 */
const verifyJwtHeader = async (request, response, next) => {
  try {
    let rawJwtHeader = request.headers.jwt;

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

/**
 * Middleware to handle uncaught errors.
 * @param {Object} error - The caught error.
 * @param {Object} request - Express request object.
 * @param {Object} response - Express response object.
 * @param {Function} next - Express next middleware function.
 */
const handleErrors = (error, request, response, next) => {
  console.error('Unhandled error:', error);

  // Handle and respond to the client appropriately
  if (response.headersSent) {
    return next(error); // Pass the error to the next middleware if headers are already sent
  }

  response.status(500).json({
    error: 'Internal Server Error',
    message: error.message,
  });
};

/**
 * Middleware to validate user email uniqueness.
 * @param {Object} request - Express request object.
 * @param {Object} response - Express response object.
 * @param {Function} next - Express next middleware function.
 */
const uniqueEmailCheck = async (request, response, next) => {
  try {
    const isEmailInUse = await User.exists({ email: request.body.email }).exec();
    if (isEmailInUse) {
      return response.status(409).json({
        error: 'Conflict',
        message: 'An account with this email address already exists.',
      });
    } else {
      next();
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  verifyJwtHeader,
  handleErrors,
  uniqueEmailCheck,
};
