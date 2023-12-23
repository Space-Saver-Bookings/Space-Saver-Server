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
const {createRoom} = require('../src/functions/roomFunctions');

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
  const emailsToDelete = ['test.user5@test4.com', 'test.403user5@test4.com'];
  for (const email of emailsToDelete) {
    await deleteUserByEmail(email);
  }
});

describe('Booking Router', () => {
  describe('GET /bookings', () => {
    test('should return an array of bookings', async () => {
      // Register a user and create a space for testing
      const registerResponse = await request(app).post('/users/register').send({
        first_name: 'Ada',
        last_name: 'Lovelace',
        email: 'test.user5@test4.com',
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
        email: 'test.user5@test4.com',
        password: 'password123',
      });

      const jwt = await loginResponse.body.jwt;

      const startTime = new Date();
      const endTime = new Date(startTime);

      startTime.setHours(startTime.getHours() - 1);
      endTime.setHours(endTime.getHours() + 1);

      const startTimeString = startTime.toISOString();
      const endTimeString = endTime.toISOString();

      // Make a request to the endpoint with the JWT in the headers
      const response = await request(app).get(`/bookings`).set('jwt', jwt);

      // Assertions
      expect(response.status).toBe(200);
      expect(response.body.bookingCount).toBeGreaterThanOrEqual(1);
      expect(response.body.bookings).toBeInstanceOf(Array);
    });
    test('should return an array of bookings and query parameters', async () => {
      // Register a user and create a space for testing
      const registerResponse = await request(app).post('/users/register').send({
        first_name: 'Ada',
        last_name: 'Lovelace',
        email: 'test.user5@test4.com',
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
        email: 'test.user5@test4.com',
        password: 'password123',
      });

      const jwt = await loginResponse.body.jwt;

      const startTime = new Date();
      const endTime = new Date(startTime);

      startTime.setHours(startTime.getHours() - 1);
      endTime.setHours(endTime.getHours() + 1);

      const startTimeString = startTime.toISOString();
      const endTimeString = endTime.toISOString();

      // Make a request to the endpoint with the JWT in the headers
      const response = await request(app)
        .get(
          `/bookings?primary_user=true&invited_user=true&start_time=${startTimeString}&end_time=${endTimeString}`
        )
        .set('jwt', jwt);

      // Assertions
      expect(response.status).toBe(200);
      expect(response.body.bookingCount).toBeGreaterThanOrEqual(1);
      expect(response.body.bookings).toBeInstanceOf(Array);
    });
  });

  describe('GET /bookings/:bookingId', () => {
    test('should return details of a specific booking', async () => {
      const registerResponse = await request(app).post('/users/register').send({
        first_name: 'Ada',
        last_name: 'Lovelace',
        email: 'test.user5@test4.com',
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
        email: 'test.user5@test4.com',
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
    test('should handle non existant room details', async () => {
      const registerResponse = await request(app).post('/users/register').send({
        first_name: 'Ada',
        last_name: 'Lovelace',
        email: 'test.user5@test4.com',
        password: 'password123',
        post_code: '54321',
        country: 'NZ',
        position: 'Developer',
      });

      // Log in the user and get the JWT
      const loginResponse = await request(app).post('/users/login').send({
        email: 'test.user5@test4.com',
        password: 'password123',
      });

      const jwt = await loginResponse.body.jwt;

      // Make a request to the endpoint with the JWT in the headers
      const response = await request(app)
        .get(`/bookings/123412341234123412341234`)
        .set('jwt', jwt);

      // Assertions
      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Booking not found');
    });
  });

  describe('GET /bookings/room', () => {
    test('should return bookings per room for the user', async () => {
      const registerResponse = await request(app).post('/users/register').send({
        first_name: 'Ada',
        last_name: 'Lovelace',
        email: 'test.user5@test4.com',
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
        email: 'test.user5@test4.com',
        password: 'password123',
      });

      const jwt = await loginResponse.body.jwt;

      const startTime = new Date();

      startTime.setFullYear(startTime.getFullYear() - 1);

      const response = await request(app)
        .get(`/bookings/room?start_time=${startTime}`)
        .set('jwt', jwt);

      expect(response.status).toBe(200);
      expect(response.body.bookingsPerRoom).toBeInstanceOf(Array);
    });
  });

  describe('GET /bookings/available-time-slots', () => {
    test('should return available time slots for a room', async () => {
      const registerResponse = await request(app).post('/users/register').send({
        first_name: 'Ada',
        last_name: 'Lovelace',
        email: 'test.user5@test4.com',
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
        email: 'test.user5@test4.com',
        password: 'password123',
      });

      const jwt = await loginResponse.body.jwt;

      const response = await request(app)
        .get(`/bookings/available-time-slots`)
        .set('jwt', jwt);

      expect(response.status).toBe(200);
      expect(response.body.availableTimeSlots).toBeInstanceOf(Array);
    });
  });

  describe('POST /bookings', () => {
    test('should create a new booking', async () => {
      const registerResponse = await request(app).post('/users/register').send({
        first_name: 'Ada',
        last_name: 'Lovelace',
        email: 'test.user5@test4.com',
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
        email: 'test.user5@test4.com',
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
    test('should not create with non existant room', async () => {
      const registerResponse = await request(app).post('/users/register').send({
        first_name: 'Ada',
        last_name: 'Lovelace',
        email: 'test.user5@test4.com',
        password: 'password123',
        post_code: '54321',
        country: 'NZ',
        position: 'Developer',
      });

      const loginResponse = await request(app).post('/users/login').send({
        email: 'test.user5@test4.com',
        password: 'password123',
      });

      const jwt = await loginResponse.body.jwt;
      const roomId = '123412341234123412341234';
      const bookingDetails = {
        room_id: '123412341234123412341234',
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
      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        `Could not find room with id: ${roomId}`
      );
    });
    test('should not allow start date after end date', async () => {
      const registerResponse = await request(app).post('/users/register').send({
        first_name: 'Ada',
        last_name: 'Lovelace',
        email: 'test.user5@test4.com',
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
        email: 'test.user5@test4.com',
        password: 'password123',
      });

      const jwt = await loginResponse.body.jwt;

      const now = new Date();
      const oneHourAgo = new Date(now);
      oneHourAgo.setHours(now.getHours() - 1);

      const bookingDetails = {
        room_id: createdRoom._id.toString(),
        title: 'Test Booking',
        description: 'This is a test booking',
        start_time: new Date(),
        end_time: oneHourAgo,
      };

      // Make a request to the endpoint with the JWT in the headers
      const response = await request(app)
        .post(`/bookings`)
        .set('jwt', jwt)
        .send(bookingDetails);

      // Assertions
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Start date cannot be after end date.');
    });
  });

  describe('PUT /bookings/:bookingId', () => {
    test('should update details of a specific booking', async () => {
      const registerResponse = await request(app).post('/users/register').send({
        first_name: 'Ada',
        last_name: 'Lovelace',
        email: 'test.user5@test4.com',
        password: 'password123',
        post_code: '54321',
        country: 'NZ',
        position: 'Developer',
      });
      const registerResponse2 = await request(app)
        .post('/users/register')
        .send({
          first_name: 'Ada',
          last_name: 'Lovelace',
          email: 'test.user5@test4.com',
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
        email: 'test.user5@test4.com',
        password: 'password123',
      });

      const jwt = await loginResponse.body.jwt;
      const updatedBookingDetails = {
        primary_user_id: registerResponse.body.user._id,
        title: 'Updated - Test Booking',
        description: 'Updated - This is a test booking',
        end_time: new Date(),
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
    test('should handle non existant room updating a specific booking', async () => {
      const registerResponse = await request(app).post('/users/register').send({
        first_name: 'Ada',
        last_name: 'Lovelace',
        email: 'test.user5@test4.com',
        password: 'password123',
        post_code: '54321',
        country: 'NZ',
        position: 'Developer',
      });
      const registerResponse2 = await request(app)
        .post('/users/register')
        .send({
          first_name: 'Ada',
          last_name: 'Lovelace',
          email: 'test.user5@test4.com',
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
        email: 'test.user5@test4.com',
        password: 'password123',
      });
      
      const roomId = '123412341234123412341234';
      const jwt = await loginResponse.body.jwt;
      const updatedBookingDetails = {
        room_id: roomId
      };
      // Make a request to the endpoint with the JWT in the headers
      const response = await request(app)
        .put(`/bookings/${createdBooking._id.toString()}`)
        .set('jwt', jwt)
        .send(updatedBookingDetails);

      // Assertions
      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        `Could not find room with id: ${roomId}`
      );
    });
    test('should not update details of a non existant booking', async () => {
      const registerResponse = await request(app).post('/users/register').send({
        first_name: 'Ada',
        last_name: 'Lovelace',
        email: 'test.user5@test4.com',
        password: 'password123',
        post_code: '54321',
        country: 'NZ',
        position: 'Developer',
      });

      // Log in the user and get the JWT
      const loginResponse = await request(app).post('/users/login').send({
        email: 'test.user5@test4.com',
        password: 'password123',
      });

      const jwt = await loginResponse.body.jwt;

      const updatedBookingDetails = {
        primary_user_id: registerResponse.body.user._id,
        title: 'Updated - Test Booking',
        description: 'Updated - This is a test booking',
        end_time: new Date(),
      };
      // Make a request to the endpoint with the JWT in the headers
      const response = await request(app)
        .put(`/bookings/123412341234123412341234`)
        .set('jwt', jwt)
        .send(updatedBookingDetails);

      // Assertions
      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Booking not found');
    });
  });

  describe('DELETE /bookings/:bookingId', () => {
    test('should delete a specific booking', async () => {
      const registerResponse = await request(app).post('/users/register').send({
        first_name: 'Ada',
        last_name: 'Lovelace',
        email: 'test.user5@test4.com',
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
        email: 'test.user5@test4.com',
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
    test('should handle non existant booking deletion', async () => {
      const registerResponse = await request(app).post('/users/register').send({
        first_name: 'Ada',
        last_name: 'Lovelace',
        email: 'test.user5@test4.com',
        password: 'password123',
        post_code: '54321',
        country: 'NZ',
        position: 'Developer',
      });

      // Log in the user and get the JWT
      const loginResponse = await request(app).post('/users/login').send({
        email: 'test.user5@test4.com',
        password: 'password123',
      });

      const jwt = await loginResponse.body.jwt;

      // Make a request to the endpoint with the JWT in the headers
      const response = await request(app)
        .delete(`/bookings/123412341234123412341234`)
        .set('jwt', jwt);

      // Assertions
      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Booking not found');
    });
    test('should handle non authorised deletion of a specific booking', async () => {
      const ownerResponse = await request(app).post('/users/register').send({
        first_name: 'Ada',
        last_name: 'Lovelace',
        email: 'test.user5@test4.com',
        password: 'password123',
        post_code: '54321',
        country: 'NZ',
        position: 'Developer',
      });
      const registerResponse = await request(app).post('/users/register').send({
        first_name: 'Ada',
        last_name: 'Lovelace',
        email: 'test.403user5@test4.com',
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

      const bookingDetails = {
        primary_user_id: ownerResponse.body.user._id,
        room_id: createdRoom._id.toString(),
        title: 'Test Booking',
        description: 'This is a test booking',
        start_time: new Date(),
        end_time: new Date(),
      };

      const createdBooking = await createBooking(bookingDetails);

      // Log in the user and get the JWT
      const loginResponse = await request(app).post('/users/login').send({
        email: 'test.403user5@test4.com',
        password: 'password123',
      });

      const jwt = await loginResponse.body.jwt;

      // Make a request to the endpoint with the JWT in the headers
      const response = await request(app)
        .delete(`/bookings/${createdBooking._id.toString()}`)
        .set('jwt', jwt);

      // Assertions
      expect(response.status).toBe(403);
      expect(response.body.message).toBe(
        'Unauthorised. You do not have permission.'
      );
    });
  });
});
