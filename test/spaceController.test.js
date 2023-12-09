const request = require('supertest');
const {app} = require('../src/server');

const {
  databaseConnector,
  databaseDisconnector,
  getDatabaseURL,
} = require('../src/database');

const {
  getAllUsers,
  createUser,
  deleteUserByEmail,
  generateUserJWT,
} = require('../src/functions/userFunctions');

// Ensure the database is connected before all tests
beforeAll(async () => {
  const databaseURL = getDatabaseURL(process.env.NODE_ENV);
  await databaseConnector(databaseURL);
});

beforeEach(async () => {
  // Your existing beforeEach logic
  const delayDuration = 2000; // implement timeout
  await new Promise((resolve) => setTimeout(resolve, delayDuration));

  const emailsToDelete = ['bob.johnson@example.com'];
  for (email of emailsToDelete) {
    await deleteUserByEmail(email);
  }
});

// disconnect after tests
afterAll(async () => {
  await databaseDisconnector();
});

describe('Space Router', () => {
  describe('GET /spaces', () => {
    test('should return an array of spaces', async () => {
      // Create a test user in the database
      const testUser = {
        first_name: 'Bob',
        last_name: 'Johnson',
        email: 'bob.johnson@example.com',
        password: 'bobspassword',
        post_code: '54321',
        country: 'ID',
        position: 'Designer',
      };

      const createdUser = await createUser(testUser);
      // Generate a JWT for the created user
      const jwt = await generateUserJWT({
        userID: createdUser._id,
        email: createdUser.email,
        password: testUser.password,
      });
      console.log(jwt);
      // Make a request to the endpoint with the JWT in the headers
      const response = await request(app)
        .get('/spaces')
        .set('Authorization', `Bearer ${jwt}`);

      // Assertions
      expect(response.status).toBe(200);
      expect(response.body.spaceCount).toBeGreaterThanOrEqual(0);
      expect(response.body.spaces).toBeInstanceOf(Array);
    });
  });

  describe('GET /spaces/:spaceID', () => {
    // Your test for GET /spaces/:spaceID route
  });

  describe('POST /spaces', () => {
    // Your test for POST /spaces route
  });

  describe('PUT /spaces/:spaceID', () => {
    // Your test for PUT /spaces/:spaceID route
  });

  describe('DELETE /spaces/:spaceID', () => {
    // Your test for DELETE /spaces/:spaceID route
  });
});
