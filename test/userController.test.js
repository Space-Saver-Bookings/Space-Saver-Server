const request = require('supertest');
const {User} = require('../src/models/UserModel');


const {app} = require('../src/server');
const {databaseDisconnector} = require('../src/database');

// Clear the database before each test
beforeEach(async () => {
  await User.deleteOne({email: 'john.doe@example.com'});
});

// disconnect after tests
afterAll(async () => {
  await databaseDisconnector();
});


describe('User Router', () => {
  describe('POST /users/register', () => {
    it('should register a new user', async () => {
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
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        post_code: '12345',
        country: 'NZ',
        position: 'Developer',
      });

      const response = await request(app).post('/users/register').send({
        first_name: 'Alice',
        last_name: 'Smith',
        email: 'john.doe@example.com',
        password: 'securepass',
        post_code: '67890',
        country: 'AUS',
        position: 'Manager',
      });

      expect(response.status).toBe(500); // Expect a 500 status for duplicate email
    });
  });

});