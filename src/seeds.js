const mongoose = require('mongoose');

const {databaseConnector, getDatabaseURL} = require('./database');
// models
const {User} = require('./models/UserModel');
const { Space } = require('./models/SpaceModel');
const { Room } = require('./models/RoomModel');
const { Booking } = require('./models/BookingModel');
// functions
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
  admin_id: null, // Placeholder
  user_ids: [], // Placeholder
  name: 'Sample Space',
  description: 'This is a sample space',
  invite_code: 'sample_invite_code',
  capacity: 10,
};

const roomsData = [
  {
    space_id: null, // Placeholder
    room_id: null, // Placeholder
    name: 'Room 1',
    description: 'This is Room 1',
    capacity: 5,
  },
  {
    space_id: null,
    room_id: null,
    name: 'Room 2',
    description: 'This is Room 2',
    capacity: 8,
  },
];

const bookingsData = [
  {
    room_id: null, // Placeholder
    primary_user_id: null, // Placeholder
    invited_user_ids: [],
    title: 'Meeting 1',
    description: 'This is Meeting 1',
    start_time: new Date('2023-01-01T08:00:00Z'),
    end_time: new Date('2023-01-01T09:00:00Z'),
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
    const usersCreated = await User.insertMany(users);

    // Update the space data with the created user IDs
    spaceData.admin_id = usersCreated[0]._id; // Use the first user as the admin
    spaceData.user_ids = usersCreated.map((user) => user._id);

    // Save the space to the database.
    const spaceCreated = await Space.create(spaceData);

    // Update the rooms data with the created space ID
    roomsData.forEach((room) => {
      room.space_id = spaceCreated._id;
    });

    // Save the rooms to the database.
    const roomsCreated = await Room.insertMany(roomsData);

    // Update the bookings data with the created room and user IDs
    bookingsData.forEach((booking) => {
      booking.room_id = roomsCreated[0]._id; // Use the first room for the booking
      booking.primary_user_id = usersCreated[0]._id; // Use the first user as the primary user
    });

    // Save the bookings to the database.
    const bookingsCreated = await Booking.insertMany(bookingsData);

    // Log modified to list all data created.
    console.log(
      'New DB data created.\n' +
        JSON.stringify(
          {
            users: usersCreated,
            spaces: spaceCreated,
            rooms: roomsCreated,
            bookings: bookingsCreated,
          },
          null,
          4
        )
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
