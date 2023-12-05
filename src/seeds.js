const mongoose = require('mongoose');

const {databaseConnector, getDatabaseURL} = require('./database');
// import models
const {User} = require('./models/UserModel');
// model functions
const {hashString} = require('./functions/userFunctions');

const dotenv = require('dotenv');
dotenv.config();

const users = [
  {
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    password: 'password123',
    post_code: '12345',
    country: 'NZ',
    position: 'Developer',
  },
  {
    first_name: 'Alice',
    last_name: 'Smith',
    email: 'alice.smith@example.com',
    password: 'securepass',
    post_code: '67890',
    country: 'AUS',
    position: 'Manager',
  },
  {
    first_name: 'Bob',
    last_name: 'Johnson',
    email: 'bob.johnson@example.com',
    password: 'bobspassword',
    post_code: '54321',
    country: 'ID',
    position: 'Designer',
  },
];

// set connection URL
const databaseURL = getDatabaseURL(process.env.NODE_ENV);

databaseConnector(databaseURL)
  .then(() => {
    console.log('Database connected successfully!');
  })
  .catch((error) => {
    console.log(`
    Some error occurred connecting to the database! It was: 
    ${error}
    `);
  })
  .then(async () => {
    if (process.env.WIPE == 'true') {
      // Get the names of all collections in the DB.
      const collections = await mongoose.connection.db
        .listCollections()
        .toArray();

      // Use Promise.all to wait for all dropCollection operations to complete.
      await Promise.all(
        collections.map(async (collection) => {
          await mongoose.connection.db.dropCollection(collection.name);
        })
      );
    }
  })
  .then(async () => {
    // Add new data into the database.

    // Iterate through the users array
    for (const user of users) {
      // Set the password of the user.
      user.password = await hashString(user.password);
    }
    // Save the users to the database.
    let usersCreated = await User.insertMany(users);

    // Log modified to list all data created.
    console.log(
      'New DB data created.\n' + JSON.stringify({users: usersCreated}, null, 4)
    );
  })
  .then(() => {
    // Disconnect from the database.
    mongoose.connection.close();
    console.log('DB seed connection closed.');
  });
