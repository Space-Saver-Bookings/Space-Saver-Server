
const request = require("supertest");

const { app } = require("../src/server");
const { databaseDisconnector } = require("../src/database");

// disconnect after tests
afterAll(async () => {
  await databaseDisconnector();
});

describe("Server '/' route exists and returns the hello world", () => {
    it("'/' route exists and returns status 200", async () => {
        const responseResult = await request(app).get("/");
        expect(responseResult.statusCode).toEqual(200);
    });

    it("'/'' route exists and returns hello world message", async () => {
        const response = await request(app).get("/");
        expect(response.body.message).toEqual("Hello world!");
    });
});


