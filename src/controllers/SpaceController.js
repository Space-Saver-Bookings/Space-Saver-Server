// import Express library
const express = require('express');

const { Space } = require("../models/SpaceModel");
const {verifyJwtHeader } = require("../middleware/sharedMiddleware")

// make an instance of a Router
const router = express.Router();

const { getAllSpaces,
    getOneSpace,
    createSpace,
    updateUser,
    deleteUser,
    filterUndefinedProperties} = require('../functions/spaceFunctions')


// List all spaces
router.get('/', verifyJwtHeader, async (request, response) => {
    let allSpaces = await getAllSpaces();
    console.log(allSpaces)

  response.json({
    spaceCount: allSpaces.length,
    spaces: allSpaces,
  });
});

// Show a specific space
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


module.exports = router;