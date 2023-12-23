const {verifyUserJWT} = require('../functions/userFunctions');
const { User } = require('../models/UserModel');

/**
 * Middleware for verifying JWT in the request header.
 *
 * @param {Object} request - Express request object.
 * @param {Object} response - Express response object.
 * @param {Function} next - Express next middleware function.
 * @returns {void}
 */
const verifyJwtHeader = async (request, response, next) => {
  try {
    const rawJwtHeader = request.headers.jwt;

    let jwtRefresh;
    try {
      jwtRefresh = await verifyUserJWT(rawJwtHeader);
    } catch (error) {
      handleJwtVerificationError(error, response);
      return;
    }

    request.headers.jwt = jwtRefresh;
    next();
  } catch (error) {
    handleGenericError(error, response);
  }
};

/**
 * Handles errors related to JWT verification and sends appropriate responses.
 *
 * @param {Error} error - The error object.
 * @param {Object} response - Express response object.
 * @returns {void}
 */
const handleJwtVerificationError = (error, response) => {
  if (error.message === 'TokenExpired') {
    response.status(401).json({
      error: 'Token expired',
      message:
        'The provided token has expired. Please log in again to obtain a new token.',
    });
  } else if (error.message === 'InvalidToken') {
    response.status(401).json({
      error: 'Invalid JWT',
      message: 'The provided token is invalid.',
    });
  } else {
    handleGenericError(error, response);
  }
};

/**
 * Handles generic errors and sends an internal server error response.
 *
 * @param {Error} error - The error object.
 * @param {Object} response - Express response object.
 * @returns {void}
 */
const handleGenericError = (error, response) => {
  console.error(error);
  response.status(500).json({
    error: 'Internal Server Error',
    message: error.message,
  });
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
    return next(error);
  }

  if (error.message === 'TokenExpired') {
    return response.status(401).json({
      error: 'Token expired',
      message:
        'The provided token has expired. Please log in again to obtain a new token.',
    });
  } else if (error.message === 'InvalidToken') {
    return response.status(401).json({
      error: 'Invalid JWT',
      message: 'The provided token is invalid.',
    });
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
    const isEmailInUse = await User.exists({email: request.body.email}).exec();
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
