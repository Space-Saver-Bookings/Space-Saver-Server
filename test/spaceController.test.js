const request = require('supertest');
const {app} = require('../src/server');

const {deleteUserByEmail} = require('../src/functions/userFunctions');
const {
  createSpace,
  generateAccessCode,
} = require('../src/functions/spaceFunctions');

beforeEach(async () => {
  // Your existing beforeEach logic
  const delayDuration = 2000; // implement timeout
  await new Promise((resolve) => setTimeout(resolve, delayDuration));

  // Delete user before each test
  const emailsToDelete = ['bob.johnson@example.com'];
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
        email: 'bob.johnson@example.com',
        password: 'password123',
        post_code: '54321',
        country: 'NZ',
        position: 'Developer',
      });

      const loginResponse = await request(app).post('/users/login').send({
        email: 'bob.johnson@example.com',
        password: 'password123',
      });

      const jwt = await loginResponse.body.jwt;

      const invite_code = await generateAccessCode();

      // Create a test space
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
      expect(response.body.spaceCount).toBeGreaterThanOrEqual(1); // Assuming the created space is included
      expect(response.body.spaces).toBeInstanceOf(Array);
    });
  });

  describe('GET /spaces/:spaceID', () => {
    test('should return details of a specific space', async () => {
      const registerResponse = await request(app).post('/users/register').send({
        first_name: 'Bob',
        last_name: 'Johnson',
        email: 'bob.johnson@example.com',
        password: 'password123',
        post_code: '54321',
        country: 'NZ',
        position: 'Developer',
      });

      const loginResponse = await request(app).post('/users/login').send({
        email: 'bob.johnson@example.com',
        password: 'password123',
      });

      const jwt = loginResponse.body.jwt;

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
      expect(response.body).toMatchObject(spaceDetails);
    });
  });

  describe('POST /spaces', () => {
    test('should create a new space', async () => {
      const registerResponse = await request(app).post('/users/register').send({
        first_name: 'Bob',
        last_name: 'Johnson',
        email: 'bob.johnson@example.com',
        password: 'password123',
        post_code: '54321',
        country: 'NZ',
        position: 'Developer',
      });

      const loginResponse = await request(app).post('/users/login').send({
        email: 'bob.johnson@example.com',
        password: 'password123',
      });

      const jwt = loginResponse.body.jwt;

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

      expect(response.status).toBe(200);
      expect(response.body.space).toMatchObject(spaceDetails);
    });
  });

  describe('PUT /spaces/:spaceID', () => {
    test('should update details of a specific space', async () => {
      const registerResponse = await request(app).post('/users/register').send({
        first_name: 'Bob',
        last_name: 'Johnson',
        email: 'bob.johnson@example.com',
        password: 'password123',
        post_code: '54321',
        country: 'NZ',
        position: 'Developer',
      });

      const loginResponse = await request(app).post('/users/login').send({
        email: 'bob.johnson@example.com',
        password: 'password123',
      });

      const jwt = loginResponse.body.jwt;
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

  describe('DELETE /spaces/:spaceID', () => {
    test('should delete a specific space', async () => {
      const registerResponse = await request(app).post('/users/register').send({
        first_name: 'Bob',
        last_name: 'Johnson',
        email: 'bob.johnson@example.com',
        password: 'password123',
        post_code: '54321',
        country: 'NZ',
        position: 'Developer',
      });

      const loginResponse = await request(app).post('/users/login').send({
        email: 'bob.johnson@example.com',
        password: 'password123',
      });

      const jwt = loginResponse.body.jwt;
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
