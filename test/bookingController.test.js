const request = require('supertest');
const {app} = require('../src/server');

const {
  getDatabaseURL,
  databaseConnector,
  databaseDisconnector,
} = require('../src/database');
const {deleteUserByEmail} = require('../src/functions/userFunctions');
const {createBooking} = require('../src/functions/bookingFunctions');
const {
  generateAccessCode,
  createSpace,
} = require('../src/functions/spaceFunctions');
const {createRoom} = require('../src/functions/roomFunctions')

// Ensure the database is connected before all tests
beforeAll(async () => {
  const databaseURL = getDatabaseURL(process.env.NODE_ENV);
  await databaseConnector(databaseURL);
});

// Disconnect after tests
afterAll(async () => {
  await databaseDisconnector();
});

beforeEach(async () => {
  // Your existing beforeEach logic
  const delayDuration = 2000; // implement timeout
  await new Promise((resolve) => setTimeout(resolve, delayDuration));
  // Delete user before each test
  const emailsToDelete = ['ada.lovelace@example.com'];
  for (const email of emailsToDelete) {
    await deleteUserByEmail(email);
  }
}, 10000);

describe('Booking Router', () => {
  describe('GET /bookings', () => {
    test('should return an array of bookings', async () => {
      // Register a user and create a space for testing
      const registerResponse = await request(app).post('/users/register').send({
        first_name: 'Ada',
        last_name: 'Lovelace',
        email: 'ada.lovelace@example.com',
        password: 'password123',
        post_code: '54321',
        country: 'NZ',
        position: 'Developer',
      });

      // Log in the user and get the JWT
      const loginResponse = await request(app).post('/users/login').send({
        email: 'ada.lovelace@example.com',
        password: 'password123',
      });

      const jwt = await loginResponse.body.jwt;

      // Make a request to the endpoint with the JWT in the headers
      const response = await request(app).get('/bookings').set('jwt', jwt);

      // Assertions
      expect(response.status).toBe(200);
      expect(response.body.bookingCount).toBeGreaterThanOrEqual(0);
      expect(response.body.bookings).toBeInstanceOf(Array);
    });
  });

  describe('GET /bookings/:bookingID', () => {
    test('should return details of a specific booking', async () => {
      const registerResponse = await request(app).post('/users/register').send({
        first_name: 'Ada',
        last_name: 'Lovelace',
        email: 'ada.lovelace@example.com',
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

      const bookingDetails = {
        room_id: createdRoom._id.toString(),
        primary_user_id: registerResponse.body.user._id,
        title: 'Test Booking',
        description: 'This is a test booking',
        start_time: new Date(),
        end_time: new Date(),
      };

      const createdBooking = await createBooking(bookingDetails);

      // Log in the user and get the JWT
      const loginResponse = await request(app).post('/users/login').send({
        email: 'ada.lovelace@example.com',
        password: 'password123',
      });

      const jwt = await loginResponse.body.jwt;

      // Make a request to the endpoint with the JWT in the headers
      const response = await request(app)
        .get(`/bookings/${createdBooking._id.toString()}`)
        .set('jwt', jwt);

      // Assertions
      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Test Booking');
    });
  });

  describe('POST /bookings', () => {
    test('should create a new booking', async () => {
      const registerResponse = await request(app).post('/users/register').send({
        first_name: 'Ada',
        last_name: 'Lovelace',
        email: 'ada.lovelace@example.com',
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

      const loginResponse = await request(app).post('/users/login').send({
        email: 'ada.lovelace@example.com',
        password: 'password123',
      });

      const jwt = await loginResponse.body.jwt;

      const bookingDetails = {
        room_id: createdRoom._id.toString(),
        title: 'Test Booking',
        description: 'This is a test booking',
        start_time: new Date(),
        end_time: new Date(),
      };

      // Make a request to the endpoint with the JWT in the headers
      const response = await request(app)
        .post(`/bookings`)
        .set('jwt', jwt)
        .send(bookingDetails);

      // Assertions
      expect(response.status).toBe(201);
    });
  });

  describe('PUT /bookings/:bookingID', () => {
    test('should update details of a specific booking', async () => {
      const registerResponse = await request(app).post('/users/register').send({
        first_name: 'Ada',
        last_name: 'Lovelace',
        email: 'ada.lovelace@example.com',
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

      const bookingDetails = {
        primary_user_id: registerResponse.body.user._id,
        room_id: createdRoom._id.toString(),
        title: 'Test Booking',
        description: 'This is a test booking',
        start_time: new Date(),
        end_time: new Date(),
      };

      const createdBooking = await createBooking(bookingDetails);

      // Log in the user and get the JWT
      const loginResponse = await request(app).post('/users/login').send({
        email: 'ada.lovelace@example.com',
        password: 'password123',
      });

      const jwt = await loginResponse.body.jwt;
      const updatedBookingDetails = {
        title: 'Updated - Test Booking',
        description: 'Updated - This is a test booking',
      };
      // Make a request to the endpoint with the JWT in the headers
      const response = await request(app)
        .put(`/bookings/${createdBooking._id.toString()}`)
        .set('jwt', jwt)
        .send(updatedBookingDetails);

      // Assertions
      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Updated - Test Booking');
    });
  });

  describe('DELETE /bookings/:bookingID', () => {
    test('should delete a specific booking', async () => {
      const registerResponse = await request(app).post('/users/register').send({
        first_name: 'Ada',
        last_name: 'Lovelace',
        email: 'ada.lovelace@example.com',
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

      const bookingDetails = {
        primary_user_id: registerResponse.body.user._id,
        room_id: createdRoom._id.toString(),
        title: 'Test Booking',
        description: 'This is a test booking',
        start_time: new Date(),
        end_time: new Date(),
      };

      const createdBooking = await createBooking(bookingDetails);

      // Log in the user and get the JWT
      const loginResponse = await request(app).post('/users/login').send({
        email: 'ada.lovelace@example.com',
        password: 'password123',
      });

      const jwt = await loginResponse.body.jwt;

      // Make a request to the endpoint with the JWT in the headers
      const response = await request(app)
        .delete(`/bookings/${createdBooking._id.toString()}`)
        .set('jwt', jwt);

      // Assertions
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Booking deleted successfully');
    });
  });
});
