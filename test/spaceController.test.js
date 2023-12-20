const request = require('supertest');
const {app} = require('../src/server');

const {
  getDatabaseURL,
  databaseConnector,
  databaseDisconnector,
} = require('../src/database');
const {deleteUserByEmail} = require('../src/functions/userFunctions');
const {
  createSpace,
  generateAccessCode,
} = require('../src/functions/spaceFunctions');

// Ensure the database is connected before all tests
beforeAll(async () => {
  const databaseURL = getDatabaseURL(process.env.NODE_ENV);
  await databaseConnector(databaseURL);
});

// disconnect after tests
afterAll(async () => {
  await databaseDisconnector();
});

beforeEach(async () => {
  // Your existing beforeEach logic
  const delayDuration = 2000; // implement timeout
  await new Promise((resolve) => setTimeout(resolve, delayDuration));

  // Delete user before each test
  const emailsToDelete = ['test.user3@test2.com'];
  for (email of emailsToDelete) {
    await deleteUserByEmail(email);
  }
}, 10000);

describe('Space Router', () => {
  describe('GET /spaces', () => {
    test('should return an array of spaces', async () => {
      // Register test user
      const registerResponse = await request(app).post('/users/register').send({
        first_name: 'Bob',
        last_name: 'Johnson',
        email: 'test.user3@test2.com',
        password: 'password123',
        post_code: '54321',
        country: 'NZ',
        position: 'Developer',
      });

      const loginResponse = await request(app).post('/users/login').send({
        email: 'test.user3@test2.com',
        password: 'password123',
      });

      const jwt = await loginResponse.body.jwt;

      const invite_code = await generateAccessCode();

      const spaceDetails = {
        admin_id: registerResponse.body.user._id,
        user_ids: [],
        name: 'Test Space',
        description: 'Test space description',
        capacity: 10,
        invite_code: invite_code,
      };

      const createdSpace = await createSpace(spaceDetails);

      // Make a request to the endpoint with the JWT in the headers
      const response = await request(app).get('/spaces').set('jwt', jwt);

      // Assertions
      expect(response.status).toBe(200);
      expect(response.body.spaceCount).toBeGreaterThanOrEqual(1);
      expect(response.body.spaces).toBeInstanceOf(Array);
    });
  });

  describe('GET /spaces/:spaceId', () => {
    test('should return details of a specific space', async () => {
      const registerResponse = await request(app).post('/users/register').send({
        first_name: 'Bob',
        last_name: 'Johnson',
        email: 'test.user3@test2.com',
        password: 'password123',
        post_code: '54321',
        country: 'NZ',
        position: 'Developer',
      });

      const loginResponse = await request(app).post('/users/login').send({
        email: 'test.user3@test2.com',
        password: 'password123',
      });

      const jwt = await loginResponse.body.jwt;

      const invite_code = await generateAccessCode();

      const spaceDetails = {
        admin_id: registerResponse.body.user._id,
        user_ids: [],
        name: 'Test Space',
        description: 'Test space description',
        capacity: 10,
        invite_code: invite_code,
      };

      const createdSpace = await createSpace(spaceDetails);

      const response = await request(app)
        .get(`/spaces/${createdSpace._id}`)
        .set('jwt', jwt);

      expect(response.status).toBe(200);
    });
  });

  describe('POST /spaces/code/:invite_code', () => {
    test('should add user to space with the given invite code and not allow duplicate', async () => {
      const registerResponse = await request(app).post('/users/register').send({
        first_name: 'Bob',
        last_name: 'Johnson',
        email: 'test.user3@test2.com',
        password: 'password123',
        post_code: '54321',
        country: 'NZ',
        position: 'Developer',
      });

      const loginResponse = await request(app).post('/users/login').send({
        email: 'test.user3@test2.com',
        password: 'password123',
      });

      const jwt = await loginResponse.body.jwt;

      const invite_code = await generateAccessCode();

      const spaceDetails = {
        admin_id: registerResponse.body.user._id,
        user_ids: [],
        name: 'Test Space',
        description: 'Test space description',
        capacity: 10,
        invite_code: invite_code,
      };

      const createdSpace = await createSpace(spaceDetails);

      // Make a request to the endpoint with the JWT in the headers
      const response = await request(app)
        .post(`/spaces/code/${invite_code}`)
        .set('jwt', jwt);
      
      // Make a request to the endpoint with the JWT in the headers
      const duplicate_response = await request(app)
        .post(`/spaces/code/${invite_code}`)
        .set('jwt', jwt);

      // Assertions
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('User joined space successfully');
      expect(duplicate_response.status).toBe(409);
      expect(duplicate_response.body.message).toBe(
        'User is already part of the space'
      );
    });
  });

  describe('POST /spaces', () => {
    test('should create a new space', async () => {
      const registerResponse = await request(app).post('/users/register').send({
        first_name: 'Bob',
        last_name: 'Johnson',
        email: 'test.user3@test2.com',
        password: 'password123',
        post_code: '54321',
        country: 'NZ',
        position: 'Developer',
      });

      const loginResponse = await request(app).post('/users/login').send({
        email: 'test.user3@test2.com',
        password: 'password123',
      });

      const jwt = await loginResponse.body.jwt;

      const spaceDetails = {
        user_ids: [],
        name: 'New Test Space',
        description: 'New test space description',
        capacity: 15,
      };

      const response = await request(app)
        .post('/spaces')
        .set('jwt', jwt)
        .send(spaceDetails);

      expect(response.status).toBe(201);
    });
  });

  describe('PUT /spaces/:spaceId', () => {
    test('should update details of a specific space', async () => {
      const registerResponse = await request(app).post('/users/register').send({
        first_name: 'Bob',
        last_name: 'Johnson',
        email: 'test.user3@test2.com',
        password: 'password123',
        post_code: '54321',
        country: 'NZ',
        position: 'Developer',
      });

      const loginResponse = await request(app).post('/users/login').send({
        email: 'test.user3@test2.com',
        password: 'password123',
      });

      const jwt = await loginResponse.body.jwt;
      // add invite code as not using the POST route
      const invite_code = await generateAccessCode();

      const spaceDetails = {
        admin_id: registerResponse.body.user._id,
        user_ids: [],
        name: 'Test Space',
        description: 'Test space description',
        capacity: 10,
        invite_code: invite_code,
      };

      const createdSpace = await createSpace(spaceDetails);

      const updatedSpaceDetails = {
        user_ids: [],
        name: 'Updated Test Space',
        description: 'Updated test space description',
        capacity: 20,
      };

      const response = await request(app)
        .put(`/spaces/${createdSpace._id}`)
        .set('jwt', jwt)
        .send(updatedSpaceDetails);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject(updatedSpaceDetails);
    });
  });

  describe('DELETE /spaces/:spaceId', () => {
    test('should delete a specific space', async () => {
      const registerResponse = await request(app).post('/users/register').send({
        first_name: 'Bob',
        last_name: 'Johnson',
        email: 'test.user3@test2.com',
        password: 'password123',
        post_code: '54321',
        country: 'NZ',
        position: 'Developer',
      });

      const loginResponse = await request(app).post('/users/login').send({
        email: 'test.user3@test2.com',
        password: 'password123',
      });

      const jwt = await loginResponse.body.jwt;
      // add invite code as not using the POST route
      const invite_code = await generateAccessCode();

      const spaceDetails = {
        admin_id: registerResponse.body.user._id,
        user_ids: [],
        name: 'Test Space',
        description: 'Test space description',
        capacity: 10,
        invite_code: invite_code,
      };

      const createdSpace = await createSpace(spaceDetails);

      const response = await request(app)
        .delete(`/spaces/${createdSpace._id}`)
        .set('jwt', jwt);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        message: 'Space deleted successfully',
      });
    });
  });
});
