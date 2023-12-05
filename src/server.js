// Make the .env data ready for use.
const dotenv = require('dotenv');
dotenv.config();

// Import the Express package and configure some needed data.
const express = require('express');
const app = express();
// If no process.env.X is found, assign a default value instead.
const HOST = process.env.HOST || 'localhost';
const PORT = process.env.PORT || 3000;

// Configure some basic Helmet settings on the server instance.
const helmet = require('helmet');
app.use(helmet());
app.use(helmet.permittedCrossDomainPolicies());
app.use(helmet.referrerPolicy());
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
    },
  })
);

// configure CORS settings
const cors = require('cors');
var corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// API-friendly request data formatting.
app.use(express.json());
app.use(express.urlencoded({extended: true}));

const mongoose = require('mongoose');
const {databaseConnector, getDatabaseURL} = require('./database');
// set connection URL
const databaseURL = getDatabaseURL(process.env.NODE_ENV);

databaseConnector(databaseURL)
  .then(() => {
    console.log(
      `Database connected successfully! \n Host: ${HOST} \n Port: ${PORT}`
    );
  })
  .catch((error) => {
    console.log(`
    ERROR occurred connecting to the database! It was:\n
    ${JSON.stringify(error)}
    `);
  });

// test route
app.get('/', (request, response) => {
  response.json({
    message: 'Hello world!',
  });
});

const userController = require("./controllers/UserController")
app.use('/users', userController)

const spaceController = require("./controllers/SpaceController")
app.use('/spaces', spaceController)

// handle all other routes --> leave at bottom of page
app.get('*', (request, response) => {
  response.status(404).json({
    message: 'No route with that path found!',
    attemptedPath: request.path,
  });
});

module.exports = {
  HOST,
  PORT,
  app,
};
