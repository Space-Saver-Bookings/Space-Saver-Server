const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const {app} = require('../src/server');

const {User} = require('../src/models/UserModel');
const {deleteUserByEmail} = require('../src/functions/userFunctions');
const {
  getDatabaseURL,
  databaseConnector,
  databaseDisconnector,
} = require('../src/database');

// Ensure the users don't exist before tests
beforeAll(async () => {
  const databaseURL = getDatabaseURL(process.env.NODE_ENV);
  await databaseConnector(databaseURL);

  const emailsToDelete = [
    'test.user@test1.com',
    'test.user2@test1.com',
    'test.403user2@test1.com',
  ];
  for (email of emailsToDelete) {
    await deleteUserByEmail(email);
  }
});

// disconnect after tests
afterAll(async () => {
  await databaseDisconnector();
});

beforeEach(async () => {
  const delayDuration = 2000;

  // Use setTimeout for the delay
  await new Promise((resolve) => setTimeout(resolve, delayDuration));
});

describe('User Router', () => {
  describe('POST /users/register', () => {
    it('should register a new user', async () => {
      const response = await request(app).post('/users/register').send({
        first_name: 'Test',
        last_name: 'Smith',
        email: 'test.user2@test1.com',
        password: 'securepass',
        post_code: '67890',
        country: 'AUS',
        position: 'Manager',
      });

      expect(response.status).toBe(200);
      expect(response.body.user.email).toBe('test.user2@test1.com');
    });

    it('should handle duplicate email', async () => {
      const response = await request(app).post('/users/register').send({
        first_name: 'Test',
        last_name: 'Smith',
        email: 'test.user2@test1.com',
        password: 'securepass',
        post_code: '67890',
        country: 'AUS',
        position: 'Manager',
      });

      expect(response.status).toBe(409);
    });
  });

  describe('POST /users/login', () => {
    it('should login an existing user', async () => {
      const response = await request(app).post('/users/login').send({
        email: 'test.user2@test1.com',
        password: 'securepass',
      });

      expect(response.status).toBe(200);
      expect(response.body.jwt).toBeTruthy();
    });

    it('should handle invalid login details', async () => {
      const response = await request(app).post('/users/login').send({
        email: 'nonexistent.user@example.com',
        password: 'invalidpassword',
      });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('User not found.');
    });
    it('should handle incorrect password', async () => {
      const response = await request(app).post('/users/login').send({
        email: 'test.user2@test1.com',
        password: 'invalidpassword',
      });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid password.');
    });
  });

  describe('POST /users/token-refresh', () => {
    it("should extend a user's JWT validity", async () => {
      // Login the user to get the initial JWT
      const loginResponse = await request(app).post('/users/login').send({
        email: 'test.user2@test1.com',
        password: 'securepass',
      });

      const jwt = await loginResponse.body.jwt;

      // Refresh the token
      const refreshResponse = await request(app)
        .post('/users/token-refresh')
        .send({jwt: jwt});

      expect(refreshResponse.status).toBe(200);
      expect(refreshResponse.body.jwt).toBeTruthy();
    });
    it('should handle invalid JWT for token refresh', async () => {
      const response = await request(app)
        .post('/users/token-refresh')
        .send({jwt: 'invalidjwt'});

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid JWT');
      expect(response.body.message).toBe('The provided token is invalid.');
    });
  });
  describe('GET /users', () => {
    it('should return a list of users', async () => {
      const loginResponse = await request(app).post('/users/login').send({
        email: 'test.user2@test1.com',
        password: 'securepass',
      });

      const jwt = await loginResponse.body.jwt;

      // Make a request to the endpoint with the JWT in the headers
      const response = await request(app).get('/users').set('jwt', jwt);

      expect(response.status).toBe(200);
      expect(response.body.userCount).toBeGreaterThanOrEqual(0);
      expect(response.body.users).toBeInstanceOf(Array);
    });
  });

  describe('GET /users/:userId', () => {
    it('should return a specific user', async () => {
      const userResponse = await request(app).post('/users/register').send({
        first_name: 'Test',
        last_name: 'Smith',
        email: 'test.user2@test1.com',
        password: 'securepass',
        post_code: '67890',
        country: 'AUS',
        position: 'Manager',
      });
      const loginResponse = await request(app).post('/users/login').send({
        email: 'test.user2@test1.com',
        password: 'securepass',
      });

      const jwt = await loginResponse.body.jwt;

      // Get the Id of the registered user
      const user = await User.findOne({email: 'test.user2@test1.com'});

      const userId = user._id.toString();

      // Make a request to the endpoint with the JWT in the headers
      const response = await request(app)
        .get(`/users/${userId}`)
        .set('jwt', jwt);

      expect(response.status).toBe(200);
      expect(response.body.email).toBe('test.user2@test1.com');
    });

    it('should handle non-existent user', async () => {
      const userResponse = await request(app).post('/users/register').send({
        first_name: 'Test',
        last_name: 'Smith',
        email: 'test.user2@test1.com',
        password: 'securepass',
        post_code: '67890',
        country: 'AUS',
        position: 'Manager',
      });

      const loginResponse = await request(app).post('/users/login').send({
        email: 'test.user2@test1.com',
        password: 'securepass',
      });

      const jwt = await loginResponse.body.jwt;

      // Make a request to the endpoint with the JWT in the headers
      const response = await request(app)
        .get('/users/nonexistentUserId')
        .set('jwt', jwt);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('User not found');
    });
  });

  describe('PUT /users/:userId', () => {
    it('should update a user', async () => {
      const loginResponse = await request(app).post('/users/login').send({
        email: 'test.user2@test1.com',
        password: 'securepass',
      });

      const jwt = await loginResponse.body.jwt;

      // Get the Id of the registered user
      const user = await User.findOne({email: 'test.user2@test1.com'});
      const userId = user._id.toString();

      // Make a request to the endpoint with the JWT in the headers
      const response = await request(app)
        .put(`/users/${userId}`)
        .set('jwt', jwt)
        .send({
          first_name: 'UpdatedTest',
          last_name: 'UpdatedSmith',
        });

      expect(response.status).toBe(200);
      expect(response.body.first_name).toBe('UpdatedTest');
      expect(response.body.last_name).toBe('UpdatedSmith');
    });

    it('should handle non-existent user for update', async () => {
      const loginResponse = await request(app).post('/users/login').send({
        email: 'test.user2@test1.com',
        password: 'securepass',
      });

      const jwt = await loginResponse.body.jwt;

      // Make a request to the endpoint with the JWT in the headers
      const response = await request(app)
        .put('/users/nonexistentUserId')
        .set('jwt', jwt)
        .send({
          first_name: 'UpdatedTest',
          last_name: 'UpdatedDoe',
        });

      expect(response.status).toBe(403);
    });
    it('should return a 403 error when updating a user without proper authorisation', async () => {
      const userResponse = await request(app).post('/users/register').send({
        first_name: 'Test',
        last_name: 'Smith',
        email: 'test.403user2@test1.com',
        password: 'securepass',
        post_code: '67890',
        country: 'AUS',
        position: 'Manager',
      });

      const loginResponse = await request(app).post('/users/login').send({
        email: 'test.403user2@test1.com',
        password: 'securepass',
      });

      const jwt = await loginResponse.body.jwt;

      // Make a request to the endpoint with the JWT in the headers
      await request(app).delete(`/users/${userResponse._id}`).set('jwt', jwt);

      // Make a request to the endpoint with the JWT in the headers
      const response = await request(app)
        .put(`/users/${userResponse._id}`)
        .set('jwt', jwt)
        .send({
          first_name: 'UpdatedTest',
          last_name: 'UpdatedDoe',
        });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty(
        'message',
        'Unauthorised: You can only update your own account'
      );
    });
  });

  describe('DELETE /users/:userId', () => {
    it('should handle non-existent user for deletion', async () => {
      const loginResponse = await request(app).post('/users/login').send({
        email: 'test.user2@test1.com',
        password: 'securepass',
      });

      const jwt = await loginResponse.body.jwt;

      // Make a request to the endpoint with the JWT in the headers
      const response = await request(app)
        .delete('/users/nonexistentUserId')
        .set('jwt', jwt);

      expect(response.status).toBe(403);
    });

    it('should handle Unauthorised deletion', async () => {
      // Register another user
      await request(app).post('/users/register').send({
        first_name: 'Bob',
        last_name: 'Testson',
        email: 'test.user@test1.com',
        password: 'password123',
        post_code: '54321',
        country: 'NZ',
        position: 'Developer',
      });

      const loginResponse = await request(app).post('/users/login').send({
        email: 'test.user2@test1.com',
        password: 'securepass',
      });

      const jwt = await loginResponse.body.jwt;

      // Get the Id of the other registered user
      const otherUser = await User.findOne({email: 'test.user@test1.com'});
      const otherUserId = otherUser._id.toString();

      // Make a request to the endpoint with the JWT in the headers
      const response = await request(app)
        .delete(`/users/${otherUserId}`)
        .set('jwt', jwt);

      expect(response.status).toBe(403);
    });
    it('should delete a user', async () => {
      const loginResponse = await request(app).post('/users/login').send({
        email: 'test.user2@test1.com',
        password: 'securepass',
      });

      const jwt = await loginResponse.body.jwt;

      // Get the Id of the registered user
      const user = await User.findOne({email: 'test.user2@test1.com'});
      const userId = user._id.toString();

      // Make a request to the endpoint with the JWT in the headers
      const response = await request(app)
        .delete(`/users/${userId}`)
        .set('jwt', jwt);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('User deleted successfully');
    });
    it('should delete a user', async () => {
      const loginResponse = await request(app).post('/users/login').send({
        email: 'test.user@test1.com',
        password: 'password123',
      });

      const jwt = await loginResponse.body.jwt;

      // Get the Id of the registered user
      const user = await User.findOne({email: 'test.user@test1.com'});
      const userId = user._id.toString();

      // Make a request to the endpoint with the JWT in the headers
      const response = await request(app)
        .delete(`/users/${userId}`)
        .set('jwt', jwt);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('User deleted successfully');
    });
  });
});
