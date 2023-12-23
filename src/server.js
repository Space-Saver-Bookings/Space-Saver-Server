// Make the .env data ready for use.
const dotenv = require('dotenv');
dotenv.config();

// Import the Express package and configure some needed data.
const express = require('express');
const app = express();
// If no process.env.X is found, assign a default value instead.
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
    console.log(`Database connected successfully! \n Port: ${PORT}`);
  })
  .catch((error) => {
    console.log(`ERROR occurred connecting to the database! It was:\n
    ${JSON.stringify(error)}
    `);
  });

const userController = require('./controllers/UserController');
app.use('/users', userController);

const spaceController = require('./controllers/SpaceController');
app.use('/spaces', spaceController);

const roomController = require('./controllers/RoomController');
app.use('/rooms', roomController);

const bookingController = require('./controllers/BookingController');
app.use('/bookings', bookingController);

// Welcome route
app.get('/', (request, response) => {
  response.status(418).json({
    message: 'Welcome to the SpaceSaver API!',
    attemptedPath: request.path,
  });
});

// handle all other routes --> leave at bottom of page
app.get('*', (request, response) => {
  response.status(404).json({
    message: 'No route with that path found!',
    attemptedPath: request.path,
  });
});

// use handleErrors middleware
const {handleErrors} = require('./middleware/sharedMiddleware');
app.use(handleErrors);

module.exports = {
  PORT,
  app,
};
