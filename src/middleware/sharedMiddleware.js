const { verifyUserJWT } = require("../functions/userFunctions");

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


module.exports = {
    verifyJwtHeader
}