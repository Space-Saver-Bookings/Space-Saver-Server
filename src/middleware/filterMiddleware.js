const {getAllRooms} = require('../functions/roomFunctions');
const {getAllSpaces} = require('../functions/spaceFunctions');
const {getUserIdFromJwt} = require('../functions/userFunctions');
const {User} = require('../models/UserModel');

const filterUsersMiddleware = async (request, response, next) => {
  try {
    const requestingUserID = await getUserIdFromJwt(request.headers.jwt);

    const userSpaces = await getAllSpaces(requestingUserID);

    // Retrieve all user_ids from the spaces
    const allUserIds = userSpaces.reduce((acc, space) => {
      acc.push(space.admin_id, ...space.user_ids);
      return acc;
    }, []);

    // Remove duplicates using Set and convert back to an array
    const uniqueUserIds = [...new Set(allUserIds)];

    // Fetch users based on unique user_ids
    const filteredUsers = await User.find({_id: {$in: uniqueUserIds}});

    // Append space_id(s) to each user object and remove __v field
    const usersWithSpaceId = filteredUsers.map((user) => {
      const spaceIdsForUser = userSpaces
        .filter(
          (space) =>
            space.admin_id.equals(user._id) ||
            space.user_ids.some((id) => id.equals(user._id))
        )
          .map((space) => space._id);
        
      // Omitting __v and password fields from the user object
      const {__v, password, ...userWithoutVAndPassword} = user.toObject();

      return {...userWithoutVAndPassword, space_ids: spaceIdsForUser};
    });

    // Modify the request object or response object based on your filtering criteria
    request.filteredUsers = usersWithSpaceId;

    next(); // Move to the next middleware or route handler
  } catch (error) {
    // Handle errors appropriately
    console.error(error);
    response.status(500).send('Internal Server Error');
  }
};

const filterRoomsMiddleware = async (req, res, next) => {
  try {
    const requestingUserID = req.user.id; // Adjust based on your authentication strategy

    const userSpaces = await getAllSpaces(requestingUserID);
    const spaceIds = userSpaces.map((space) => space._id);

    // Modify the request object or response object based on your filtering criteria
    req.filteredRooms = await Room.find({space_id: {$in: spaceIds}});

    next(); // Move to the next middleware or route handler
  } catch (error) {
    // Handle errors appropriately
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};

const filterBookingsMiddleware = async (req, res, next) => {
  try {
    // Assuming requestingUserID is part of the request object, adjust accordingly
    const requestingUserID = req.user.id; // Example, modify based on your authentication strategy

    const userRooms = await getAllRooms(requestingUserID);
    const roomIds = userRooms.map((room) => room._id);

    // Modify the request object or response object based on your filtering criteria
    req.filteredBookings = await Booking.find({room_id: {$in: roomIds}});

    next(); // Move to the next middleware or route handler
  } catch (error) {
    // Handle errors appropriately
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};

module.exports = {
  filterUsersMiddleware,
  filterRoomsMiddleware,
  filterBookingsMiddleware,
};
