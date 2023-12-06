const mongoose = require('mongoose');

const {databaseConnector, getDatabaseURL} = require('./database');
const {User} = require('./models/UserModel');
const {Space} = require('./models/SpaceModel');

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


const spaceData = {
  admin_id: null, // Placeholder for the admin user
  user_ids: [], // Placeholder for user IDs
  name: 'Sample Space',
  description: 'This is a sample space',
  invite_code: 'sample_invite_code',
  capacity: 10,
};


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
    const usersCreated = await User.insertMany(users);

    // Update the space data with the created user IDs
    spaceData.admin_id = usersCreated[0]._id; // Use the first user as the admin
    spaceData.user_ids = usersCreated.map((user) => user._id);

    // Save the space to the database.
    const spaceCreated = await Space.create(spaceData);

    // Log modified to list all data created.
    console.log(
      'New DB data created.\n' +
        JSON.stringify({users: usersCreated, spaces: spaceCreated}, null, 4)
    );
  })
  .catch((error) => {
    console.log(`
    Some error occurred connecting to the database! It was: 
    ${error}
    `);
  })
  .finally(() => {
    // Disconnect from the database.
    mongoose.connection.close();
    console.log('DB seed connection closed.');
  });
