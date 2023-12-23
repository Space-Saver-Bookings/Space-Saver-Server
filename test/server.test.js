const request = require('supertest');
const {app} = require('../src/server');
const {databaseDisconnector} = require('../src/database');

describe('Server API Routes', () => {
  afterAll(async () => {
    // Disconnect from the database after all tests are complete
    await databaseDisconnector();
  });

  describe('GET /', () => {
    it('should return status 418 and a welcome message', async () => {
      const response = await request(app).get('/');
      expect(response.statusCode).toEqual(418);
      expect(response.body.message).toEqual('Welcome to the SpaceSaver API!');
    });
  });

  describe('GET /unknown-route', () => {
    it('should return status 404 and a not found message', async () => {
      const response = await request(app).get('/unknown-route');
      expect(response.statusCode).toEqual(404);
      expect(response.body.message).toEqual('No route with that path found!');
    });
  });

  describe('GET /wrong-url', () => {
    it('should return status 404 and a not found message', async () => {
      const response = await request(app).get('/wrong-url');
      expect(response.statusCode).toEqual(404);
      expect(response.body.message).toEqual('No route with that path found!');
    });
  });
});
