// Import necessary modules and functions
const mongoose = require('mongoose');
const {databaseConnector, getDatabaseURL} = require('./database');
// import models
const {User} = require('./models/UserModel');
const {Space} = require('./models/SpaceModel');
const {Room} = require('./models/RoomModel');
const {Booking} = require('./models/BookingModel');
// import functions
const {hashString} = require('./functions/userFunctions');
const {generateAccessCode} = require('./functions/spaceFunctions');

const dotenv = require('dotenv');
dotenv.config();

// Function to seed the database
async function seedDatabase() {
  try {
    // Connect to the database
    const databaseURL = getDatabaseURL(process.env.NODE_ENV);
    await databaseConnector(databaseURL);
    console.log('Database connected successfully!');

    // Check if wipe is true and drop collections
    if (process.env.WIPE == 'true') {
      const collections = await mongoose.connection.db
        .listCollections()
        .toArray();
      await Promise.all(
        collections.map(async (collection) => {
          await mongoose.connection.db.dropCollection(collection.name);
        })
      );
    }
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
      invite_code: await generateAccessCode(),
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

    // Hash passwords and create users
    for (const user of users) {
      user.password = await hashString(user.password);
    }
    const usersCreated = await User.insertMany(users);

    // Update space data with created user IDs
    spaceData.admin_id = usersCreated[0]._id;
    spaceData.user_ids = usersCreated.map((user) => user._id);
    const spaceCreated = await Space.create(spaceData);

    // Update rooms data with created space ID
    roomsData.forEach((room) => {
      room.space_id = spaceCreated._id;
    });
    const roomsCreated = await Room.insertMany(roomsData);

    // Update bookings data with created room and user IDs
    bookingsData.forEach((booking) => {
      booking.room_id = roomsCreated[0]._id;
      booking.primary_user_id = usersCreated[0]._id;
    });
    const bookingsCreated = await Booking.insertMany(bookingsData);

    // Log modified to list all data created
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
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    // Disconnect from the database
    mongoose.connection.close();
    console.log('DB seed connection closed.');
  }
}

// Call the seedDatabase function
seedDatabase();
