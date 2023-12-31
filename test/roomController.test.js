const request = require('supertest');
const {app} = require('../src/server');

const {
  getDatabaseURL,
  databaseConnector,
  databaseDisconnector,
} = require('../src/database');
const {deleteUserByEmail} = require('../src/functions/userFunctions');
const {createRoom} = require('../src/functions/roomFunctions');
const {
  generateAccessCode,
  createSpace,
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
  const emailsToDelete = [
    'test.user4@test3.com',
    'test.403user4@test3.com',
    'test.404user4@test3.com',
  ];
  for (email of emailsToDelete) {
    await deleteUserByEmail(email);
  }
});

describe('Room Router', () => {
  describe('GET /rooms', () => {
    test('should return an array of rooms', async () => {
      // Register a user and create a space for testing
      const registerResponse = await request(app).post('/users/register').send({
        first_name: 'John',
        last_name: 'Bobson',
        email: 'test.user4@test3.com',
        password: 'password123',
        post_code: '54321',
        country: 'NZ',
        position: 'Developer',
      });

      // Log in the user and get the JWT
      const loginResponse = await request(app).post('/users/login').send({
        email: 'test.user4@test3.com',
        password: 'password123',
      });

      const jwt = await loginResponse.body.jwt;

      // Make a request to the endpoint with the JWT in the headers
      const response = await request(app).get('/rooms').set('jwt', jwt);

      // Assertions
      expect(response.status).toBe(200);
      expect(response.body.roomCount).toBeGreaterThanOrEqual(0);
      expect(response.body.rooms).toBeInstanceOf(Array);
    });
  });

  describe('GET /rooms/:roomId', () => {
    test('should return details of a specific room', async () => {
      const registerResponse = await request(app).post('/users/register').send({
        first_name: 'John',
        last_name: 'Bobson',
        email: 'test.user4@test3.com',
        password: 'password123',
        post_code: '54321',
        country: 'NZ',
        position: 'Developer',
      });

      const spaceDetails = {
        admin_id: registerResponse.body.user._id,
        user_ids: [],
        name: 'Test Space',
        description: 'Test space description',
        capacity: 10,
        invite_code: await generateAccessCode(),
      };

      const createdSpace = await createSpace(spaceDetails);

      const roomDetails = {
        space_id: createdSpace._id.toString(),
        name: 'Testing room creation',
        description: 'This is a new room',
        capacity: 100,
      };

      const createdRoom = await createRoom(roomDetails);
      // Log in the user and get the JWT
      const loginResponse = await request(app).post('/users/login').send({
        email: 'test.user4@test3.com',
        password: 'password123',
      });

      const jwt = await loginResponse.body.jwt;

      // Make a request to the endpoint with the JWT in the headers
      const response = await request(app)
        .get(`/rooms/${createdRoom._id.toString()}`)
        .set('jwt', jwt);

      // Assertions
      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Testing room creation');
    });
    test('should handle get of non existant room', async () => {
      const registerResponse = await request(app).post('/users/register').send({
        first_name: 'John',
        last_name: 'Bobson',
        email: 'test.user4@test3.com',
        password: 'password123',
        post_code: '54321',
        country: 'NZ',
        position: 'Developer',
      });

      const loginResponse = await request(app).post('/users/login').send({
        email: 'test.user4@test3.com',
        password: 'password123',
      });

      const jwt = await loginResponse.body.jwt;

      // Make a request to the endpoint with the JWT in the headers
      const response = await request(app)
        .get(`/rooms/123412341234123412341234`)
        .set('jwt', jwt);

      // Assertions
      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Room not found');
    });
  });

  describe('POST /rooms', () => {
    test('should create a new room', async () => {
      const registerResponse = await request(app).post('/users/register').send({
        first_name: 'John',
        last_name: 'Bobson',
        email: 'test.user4@test3.com',
        password: 'password123',
        post_code: '54321',
        country: 'NZ',
        position: 'Developer',
      });
      const code = await generateAccessCode();
      const spaceDetails = {
        admin_id: registerResponse.body.user._id,
        user_ids: [],
        name: 'Test Space',
        description: 'Test space description',
        capacity: 10,
        invite_code: code,
      };

      const createdSpace = await createSpace(spaceDetails);

      const loginResponse = await request(app).post('/users/login').send({
        email: 'test.user4@test3.com',
        password: 'password123',
      });

      const jwt = await loginResponse.body.jwt;

      const roomDetails = {
        space_id: createdSpace._id.toString(),
        name: 'Testing room creation',
        description: 'This is a new room',
        capacity: 100,
      };

      // Make a request to the endpoint with the JWT in the headers
      const response = await request(app)
        .post(`/rooms`)
        .set('jwt', jwt)
        .send(roomDetails);

      expect(response.status).toBe(201);
    });
    test('should handle non admin users of space creating room', async () => {
      const ownerResponse = await request(app).post('/users/register').send({
        first_name: 'John',
        last_name: 'Bobson',
        email: 'test.user4@test3.com',
        password: 'password123',
        post_code: '54321',
        country: 'NZ',
        position: 'Developer',
      });
      const registerResponse = await request(app).post('/users/register').send({
        first_name: 'John',
        last_name: 'Bobson',
        email: 'test.403user4@test3.com',
        password: 'password123',
        post_code: '54321',
        country: 'NZ',
        position: 'Developer',
      });
      const code = await generateAccessCode();
      const spaceDetails = {
        admin_id: ownerResponse.body.user._id,
        user_ids: [],
        name: 'Test Space',
        description: 'Test space description',
        capacity: 10,
        invite_code: code,
      };

      const createdSpace = await createSpace(spaceDetails);

      const loginResponse = await request(app).post('/users/login').send({
        email: 'test.403user4@test3.com',
        password: 'password123',
      });

      const jwt = await loginResponse.body.jwt;

      const roomDetails = {
        space_id: createdSpace._id.toString(),
        name: 'Testing room creation',
        description: 'This is a new room',
        capacity: 100,
      };

      // Make a request to the endpoint with the JWT in the headers
      const response = await request(app)
        .post(`/rooms`)
        .set('jwt', jwt)
        .send(roomDetails);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe(
        `Unauthorised. User is not administrator for space: ${createdSpace._id}`
      );
    });
  });

  describe('PUT /rooms/:roomId', () => {
    test('should update details of a specific room', async () => {
      const registerResponse = await request(app).post('/users/register').send({
        first_name: 'John',
        last_name: 'Bobson',
        email: 'test.user4@test3.com',
        password: 'password123',
        post_code: '54321',
        country: 'NZ',
        position: 'Developer',
      });

      const spaceDetails = {
        admin_id: registerResponse.body.user._id,
        user_ids: [],
        name: 'Test Space',
        description: 'Test space description',
        capacity: 10,
        invite_code: await generateAccessCode(),
      };

      const createdSpace = await createSpace(spaceDetails);

      const roomDetails = {
        space_id: createdSpace._id.toString(),
        name: 'Testing room creation',
        description: 'This is a new room',
        capacity: 100,
      };

      const createdRoom = await createRoom(roomDetails);
      // Log in the user and get the JWT
      const loginResponse = await request(app).post('/users/login').send({
        email: 'test.user4@test3.com',
        password: 'password123',
      });

      const jwt = await loginResponse.body.jwt;
      const updatedRoomDetails = {
        name: 'Updated - testing room creation',
        description: 'Updated - this is a new room',
        capacity: 101,
      };

      const response = await request(app)
        .put(`/rooms/${createdRoom._id.toString()}`)
        .set('jwt', jwt)
        .send(updatedRoomDetails);

      // Assertions
      expect(response.status).toBe(200);
      expect(response.body.capacity).toBe(101);
    });
    test('should handle non administrators of room', async () => {
      const registerResponse = await request(app).post('/users/register').send({
        first_name: 'John',
        last_name: 'Bobson',
        email: 'test.user4@test3.com',
        password: 'password123',
        post_code: '54321',
        country: 'NZ',
        position: 'Developer',
      });

      const spaceDetails = {
        admin_id: registerResponse.body.user._id,
        user_ids: [],
        name: 'Test Space',
        description: 'Test space description',
        capacity: 10,
        invite_code: await generateAccessCode(),
      };

      const createdSpace = await createSpace(spaceDetails);

      const roomDetails = {
        space_id: createdSpace._id.toString(),
        name: 'Testing room creation',
        description: 'This is a new room',
        capacity: 100,
      };

      const createdRoom = await createRoom(roomDetails);

      const userResponse = await request(app).post('/users/register').send({
        first_name: 'John',
        last_name: 'Bobson',
        email: 'test.403user4@test3.com',
        password: 'password123',
        post_code: '54321',
        country: 'NZ',
        position: 'Developer',
      });
      // Log in the user and get the JWT
      const loginResponse = await request(app).post('/users/login').send({
        email: 'test.403user4@test3.com',
        password: 'password123',
      });

      const jwt = await loginResponse.body.jwt;

      const updatedRoomDetails = {
        name: 'Updated - testing room creation',
        description: 'Updated - this is a new room',
        capacity: 101,
      };
      // Make a request to the endpoint with the JWT in the headers
      const response = await request(app)
        .put(`/rooms/${createdRoom._id.toString()}`)
        .set('jwt', jwt)
        .send(updatedRoomDetails);

      // Assertions
      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /rooms/:roomId', () => {
    test('should delete a specific room', async () => {
      const registerResponse = await request(app).post('/users/register').send({
        first_name: 'John',
        last_name: 'Bobson',
        email: 'test.user4@test3.com',
        password: 'password123',
        post_code: '54321',
        country: 'NZ',
        position: 'Developer',
      });

      const spaceDetails = {
        admin_id: registerResponse.body.user._id,
        user_ids: [],
        name: 'Test Space',
        description: 'Test space description',
        capacity: 10,
        invite_code: await generateAccessCode(),
      };

      const createdSpace = await createSpace(spaceDetails);

      const roomDetails = {
        space_id: createdSpace._id.toString(),
        name: 'Testing room creation',
        description: 'This is a new room',
        capacity: 100,
      };

      const createdRoom = await createRoom(roomDetails);
      // Log in the user and get the JWT
      const loginResponse = await request(app).post('/users/login').send({
        email: 'test.user4@test3.com',
        password: 'password123',
      });

      const jwt = await loginResponse.body.jwt;

      // Make a request to the endpoint with the JWT in the headers
      const response = await request(app)
        .delete(`/rooms/${createdRoom._id.toString()}`)
        .set('jwt', jwt);

      // Assertions
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Room deleted successfully');
    });
    test('should return 403 when a non-administrator user tries to delete a room', async () => {
      const ownerResponse = await request(app).post('/users/register').send({
        first_name: 'John',
        last_name: 'Bobson',
        email: 'test.user4@test3.com',
        password: 'password123',
        post_code: '54321',
        country: 'NZ',
        position: 'Developer',
      });
      const userResponse = await request(app).post('/users/register').send({
        first_name: 'John',
        last_name: 'Bobson',
        email: 'test.403user4@test3.com',
        password: 'password123',
        post_code: '54321',
        country: 'NZ',
        position: 'Developer',
      });

      const spaceDetails = {
        admin_id: ownerResponse.body.user._id,
        user_ids: [],
        name: 'Test Space',
        description: 'Test space description',
        capacity: 10,
        invite_code: await generateAccessCode(),
      };

      const createdSpace = await createSpace(spaceDetails);

      const roomDetails = {
        space_id: createdSpace._id.toString(),
        name: 'Testing room creation',
        description: 'This is a new room',
        capacity: 100,
      };

      const createdRoom = await createRoom(roomDetails);
      // Log in the user and get the JWT
      const loginResponse = await request(app).post('/users/login').send({
        email: 'test.403user4@test3.com',
        password: 'password123',
      });

      const jwt = await loginResponse.body.jwt;

      // Make a request to the endpoint with the JWT in the headers
      const response = await request(app)
        .delete(`/rooms/${createdRoom._id.toString()}`)
        .set('jwt', jwt); // Provide a valid JWT for authentication

      expect(response.status).toBe(403);
      expect(response.body.error).toBe(
        `Unauthorised. User is not administrator for room: ${createdRoom._id.toString()}`
      );
    });
  });
});
