const request = require('supertest');
const {app} = require('../src/server');

const {User} = require('../src/models/UserModel');
const {
  deleteUserByEmail,
} = require('../src/functions/userFunctions');
const { getDatabaseURL, databaseConnector, databaseDisconnector } = require('../src/database');

// Ensure the users don't exist before tests
beforeAll(async () => {
  const databaseURL = getDatabaseURL(process.env.NODE_ENV);
  await databaseConnector(databaseURL);

  const emailsToDelete = ['bob.johnson@example.com', 'alice.smith@example.com'];
  for (email of emailsToDelete) {
    await deleteUserByEmail(email);
  }
}, 10000);

// disconnect after tests
afterAll(async () => {
  await databaseDisconnector();
});

beforeEach(async () => {
  const delayDuration = 2000;

  // Use setTimeout for the delay
  await new Promise((resolve) => setTimeout(resolve, delayDuration));
}, 10000);

describe('User Router', () => {
  describe('POST /users/register', () => {
    it('should register a new user', async () => {
      const response = await request(app).post('/users/register').send({
        first_name: 'Alice',
        last_name: 'Smith',
        email: 'alice.smith@example.com',
        password: 'securepass',
        post_code: '67890',
        country: 'AUS',
        position: 'Manager',
      });

      expect(response.status).toBe(200);
      expect(response.body.user.email).toBe('alice.smith@example.com');
    });

    it('should handle duplicate email', async () => {
      const response = await request(app).post('/users/register').send({
        first_name: 'Alice',
        last_name: 'Smith',
        email: 'alice.smith@example.com',
        password: 'securepass',
        post_code: '67890',
        country: 'AUS',
        position: 'Manager',
      });

      expect(response.status).toBe(500);
    });
  });

  describe('POST /users/login', () => {
    it('should login an existing user', async () => {
      const response = await request(app).post('/users/login').send({
        email: 'alice.smith@example.com',
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
  });

  describe('POST /users/token-refresh', () => {
    it("should extend a user's JWT validity", async () => {
      // Login the user to get the initial JWT
      const loginResponse = await request(app).post('/users/login').send({
        email: 'alice.smith@example.com',
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

      expect(response.status).toBe(500);
      expect(response.body.error).toBeTruthy();
    });
  });

  describe('GET /users', () => {
    it('should return a list of users', async () => {
      const loginResponse = await request(app).post('/users/login').send({
        email: 'alice.smith@example.com',
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

  describe('GET /users/:userID', () => {
    it('should return a specific user', async () => {
      const loginResponse = await request(app).post('/users/login').send({
        email: 'alice.smith@example.com',
        password: 'securepass',
      });

      const jwt = await loginResponse.body.jwt;

      // Get the ID of the registered user
      const user = await User.findOne({email: 'alice.smith@example.com'});
      const userID = user._id.toString();

      // Make a request to the endpoint with the JWT in the headers
      const response = await request(app)
        .get(`/users/${userID}`)
        .set('jwt', jwt);

      expect(response.status).toBe(200);
      expect(response.body.email).toBe('alice.smith@example.com');
    });

    it('should handle non-existent user', async () => {
      const loginResponse = await request(app).post('/users/login').send({
        email: 'alice.smith@example.com',
        password: 'securepass',
      });

      const jwt = await loginResponse.body.jwt;

      // Make a request to the endpoint with the JWT in the headers
      const response = await request(app)
        .get('/users/nonexistentUserID')
        .set('jwt', jwt);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('User not found');
    });
  });

  describe('PUT /users/:userID', () => {
    it('should update a user', async () => {
      const loginResponse = await request(app).post('/users/login').send({
        email: 'alice.smith@example.com',
        password: 'securepass',
      });

      const jwt = await loginResponse.body.jwt;

      // Get the ID of the registered user
      const user = await User.findOne({email: 'alice.smith@example.com'});
      const userID = user._id.toString();

      // Make a request to the endpoint with the JWT in the headers
      const response = await request(app)
        .put(`/users/${userID}`)
        .set('jwt', jwt)
        .send({
          first_name: 'UpdatedAlice',
          last_name: 'UpdatedSmith',
        });

      expect(response.status).toBe(200);
      expect(response.body.first_name).toBe('UpdatedAlice');
      expect(response.body.last_name).toBe('UpdatedSmith');
    });

    it('should handle non-existent user for update', async () => {
      const loginResponse = await request(app).post('/users/login').send({
        email: 'alice.smith@example.com',
        password: 'securepass',
      });

      const jwt = await loginResponse.body.jwt;

      // Make a request to the endpoint with the JWT in the headers
      const response = await request(app)
        .put('/users/nonexistentUserID')
        .set('jwt', jwt)
        .send({
          first_name: 'UpdatedJohn',
          last_name: 'UpdatedDoe',
        });

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /users/:userID', () => {
    it('should handle non-existent user for deletion', async () => {
      const loginResponse = await request(app).post('/users/login').send({
        email: 'alice.smith@example.com',
        password: 'securepass',
      });

      const jwt = await loginResponse.body.jwt;

      // Make a request to the endpoint with the JWT in the headers
      const response = await request(app)
        .delete('/users/nonexistentUserID')
        .set('jwt', jwt);

      expect(response.status).toBe(403);
    });

    it('should handle unauthorized deletion', async () => {
      // Register another user
      await request(app).post('/users/register').send({
        first_name: 'Bob',
        last_name: 'Johnson',
        email: 'bob.johnson@example.com',
        password: 'password123',
        post_code: '54321',
        country: 'NZ',
        position: 'Developer',
      });

      const loginResponse = await request(app).post('/users/login').send({
        email: 'alice.smith@example.com',
        password: 'securepass',
      });

      const jwt = await loginResponse.body.jwt;

      // Get the ID of the other registered user
      const otherUser = await User.findOne({email: 'bob.johnson@example.com'});
      const otherUserID = otherUser._id.toString();

      // Make a request to the endpoint with the JWT in the headers
      const response = await request(app)
        .delete(`/users/${otherUserID}`)
        .set('jwt', jwt);

      expect(response.status).toBe(403);
    });
    it('should delete a user', async () => {
      const loginResponse = await request(app).post('/users/login').send({
        email: 'alice.smith@example.com',
        password: 'securepass',
      });

      const jwt = await loginResponse.body.jwt;

      // Get the ID of the registered user
      const user = await User.findOne({email: 'alice.smith@example.com'});
      const userID = user._id.toString();

      // Make a request to the endpoint with the JWT in the headers
      const response = await request(app)
        .delete(`/users/${userID}`)
        .set('jwt', jwt);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('User deleted successfully');
    });
    it('should delete a user', async () => {
      const loginResponse = await request(app).post('/users/login').send({
        email: 'bob.johnson@example.com',
        password: 'password123',
      });

      const jwt = await loginResponse.body.jwt;

      // Get the ID of the registered user
      const user = await User.findOne({email: 'bob.johnson@example.com'});
      const userID = user._id.toString();

      // Make a request to the endpoint with the JWT in the headers
      const response = await request(app)
        .delete(`/users/${userID}`)
        .set('jwt', jwt);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('User deleted successfully');
    });
  });
});
