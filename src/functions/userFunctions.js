const {User} = require('../models/UserModel');

const dotenv = require('dotenv');
dotenv.config();

// --------------------------------------
// ----- Encryption & decryption functionality

const crypto = require('crypto');
let encAlgorithm = 'aes-256-cbc';
let encPrivateKey = crypto.scryptSync(process.env.ENC_KEY, 'SpecialSalt', 32);
let encIV = crypto.scryptSync(process.env.ENC_IV, 'SpecialSalt', 16);
let cipher = crypto.createCipheriv(encAlgorithm, encPrivateKey, encIV);
let decipher = crypto.createDecipheriv(encAlgorithm, encPrivateKey, encIV);

// Convert a given string into an encrypted string.
function encryptString(data) {
  cipher = crypto.createCipheriv(encAlgorithm, encPrivateKey, encIV);
  return cipher.update(data, 'utf8', 'hex') + cipher.final('hex');
}

// Turn the encrypted data back into a plaintext string.
function decryptString(data) {
  decipher = crypto.createDecipheriv(encAlgorithm, encPrivateKey, encIV);
  return decipher.update(data, 'hex', 'utf8') + decipher.final('utf8');
}

// Assumes an encrypted string is a JSON object.
// Decrypts that string and turns it into a regular JavaScript object.
function decryptObject(data) {
  return JSON.parse(decryptString(data));
}

// --------------------------------------
// ----- JWT functionality

const jwt = require('jsonwebtoken');

function generateJWT(payloadObj) {
  return jwt.sign(payloadObj, process.env.JWT_SECRET, {expiresIn: '8h'});
}

async function generateUserJWT(userDetails) {
  // Encrypt the payload so that it's not plaintext when viewed outside of this app.
  let encryptedUserData = encryptString(JSON.stringify(userDetails));
  // The expiresIn option only works if the payload is an object, not a string.
  return generateJWT({data: encryptedUserData});
}

async function verifyUserJWT(userJWT) {
  try {
    // Verify that the JWT is still valid.
    let userJwtVerified = jwt.verify(userJWT, process.env.JWT_SECRET, {
      complete: true,
    });
    
    // Decrypt the encrypted payload.
    let decryptedJwtPayload = decryptString(userJwtVerified.payload.data);
    
    // Parse the decrypted data into an object.
    let userData = JSON.parse(decryptedJwtPayload);

    // Find the user mentioned in the JWT.
    let targetUser = await User.findById(userData.userID).exec();

    // If the JWT data matches the stored data...
    if (
      targetUser &&
      ((targetUser.password, userData.password)) &&
      targetUser.email == userData.email
    ) {
      // ...User details are valid, make a fresh JWT to extend their token's valid time
      return generateJWT({data: userJwtVerified.payload.data});
    } else {
      // Otherwise, user details are invalid and they don't get a new token.
      // When a frontend receives this error, it should redirect to a sign-in page.
      throw new Error('Invalid user token.');
    }
  } catch (error) {
    console.error(error);
    throw new Error('Invalid user token.');
  }
}

// Return userId from JWT
async function getUserIdFromJwt(userJWT) {
  try {
    let userJwtVerified = jwt.verify(userJWT, process.env.JWT_SECRET, {
      complete: true,
    });

    // Decrypt the encrypted payload.
    let decryptedJwtPayload = decryptString(userJwtVerified.payload.data);

    // Parse the decrypted data into an object.
    let userData = JSON.parse(decryptedJwtPayload);

    // Find the user mentioned in the JWT.
    let targetUser = await User.findById(userData.userID).exec();

    // If the JWT data matches the stored data...
    if (
      targetUser &&
      targetUser.password == userData.password &&
      targetUser.email == userData.email
    ) {
      // Return the user ID
      return userData.userID;
    } else {
      // Otherwise, user details are invalid.
      throw new Error('Invalid user token.');
    }
  } catch (error) {
    // Handle JWT verification errors
    throw new Error('Invalid user token.');
  }
}

// --------------------------------------
// ----- Hashing & Salting functionality

const bcrypt = require('bcryptjs');
const saltRounds = 10;

async function hashString(stringToHash) {
  let saltToAdd = await bcrypt.genSalt(saltRounds);
  return await bcrypt.hash(stringToHash, saltToAdd);
}

async function validateHashedData(providedUnhashedData, storedHashedData) {
  if (providedUnhashedData === undefined || storedHashedData === undefined) {
    // Handle the case where either of the values is undefined.
    return false;
  }
  return await bcrypt.compare(providedUnhashedData, storedHashedData);
}

// --------------------------------------
// ----- MongoDB/MongooseJS functionality

// Returns an array of raw MongoDB database documents.
async function getAllUsers() {
  return await User.find({});
}

async function createUser(userDetails) {
  // Create new user based on userDetails data
  let newUser = new User({
    first_name: userDetails.first_name,
    last_name: userDetails.last_name,
    email: userDetails.email,
    password: userDetails.password,
    post_code: userDetails.post_code,
    country: userDetails.country,
    position: userDetails.position,
  });

  // And save it to DB
  return await newUser.save();
}

async function updateUser(userDetails) {
  // Find user, update it, return the updated user data.
  return await User.findByIdAndUpdate(
    userDetails.userID,
    userDetails.updatedData,
    {returnDocument: 'after'}
  ).exec();
}

async function deleteUser(userID) {
  return await User.findByIdAndDelete(userID).exec();
}

async function deleteUserByEmail(email) {
  // Check if a user with the specified email exists
  const userToDelete = await User.findOne({email});

  if (userToDelete) {
    // If the user exists, delete them
    await User.deleteOne({email});
    console.log(`User with email ${email} deleted.`);
  } else {
    console.log(`No user found with email ${email}.`);
  }
}

function filterUndefinedProperties(obj) {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== undefined)
  );
}

// --------------------------------------
// ----- Exports

module.exports = {
  encryptString,
  decryptString,
  decryptObject,
  hashString,
  validateHashedData,
  generateJWT,
  generateUserJWT,
  getUserIdFromJwt,
  verifyUserJWT,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  deleteUserByEmail,
  filterUndefinedProperties,
};
