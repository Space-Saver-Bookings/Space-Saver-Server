const request = require('supertest');
const {app} = require('../src/server');
const {
  databaseDisconnector,
  getDatabaseURL,
  databaseConnector,
} = require('../src/database');

const {User} = require('../src/models/UserModel');
const {deleteUserByEmail} = require('../src/functions/userFunctions');

// Ensure the database is connected before all tests
beforeAll(async () => {
  const databaseURL = getDatabaseURL(process.env.NODE_ENV);
  await databaseConnector(databaseURL);
});

beforeEach(async () => {
  const delayDuration = 2000; // implement timeout

  // Use setTimeout for the delay
  await new Promise((resolve) => setTimeout(resolve, delayDuration));

  const emailsToDelete = ['john.doe@example.com', 'alice.smith@example.com'];
  for (email of emailsToDelete) {
    await deleteUserByEmail(email);
  }

});

// disconnect after tests
afterAll(async () => {
  await databaseDisconnector();
});


describe('User Router', () => {
  describe('POST /users/register', () => {
    it('should register a new user', async () => {
      jest.setTimeout(10000);
      const response = await request(app).post('/users/register').send({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        post_code: '12345',
        country: 'NZ',
        position: 'Developer',
      });

      expect(response.status).toBe(200);
      expect(response.body.user.email).toBe('john.doe@example.com');
    });

    it('should handle duplicate email', async () => {
      // Register the same user twice
      await request(app).post('/users/register').send({
        first_name: 'Alice',
        last_name: 'Smith',
        email: 'alice.smith@example.com',

        password: 'password123',
        post_code: '12345',
        country: 'NZ',
        position: 'Developer',
      });

      const response = await request(app).post('/users/register').send({
        first_name: 'Alice',
        last_name: 'Smith',
        email: 'alice.smith@example.com',
        password: 'securepass',
        post_code: '67890',
        country: 'AUS',
        position: 'Manager',
      });

      expect(response.status).toBe(500); // Expect a 500 status for duplicate email
    });
  });
});