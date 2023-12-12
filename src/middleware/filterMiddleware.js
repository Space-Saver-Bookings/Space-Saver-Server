const {getAllRooms} = require('../functions/roomFunctions');
const {getAllSpaces} = require('../functions/spaceFunctions');
const {getUserIdFromJwt} = require('../functions/userFunctions');
const {Booking} = require('../models/BookingModel');
const {Room} = require('../models/RoomModel');
const {User} = require('../models/UserModel');
const {handleErrors} = require('./sharedMiddleware');

const filterUsersMiddleware = async (request, response, next) => {
  try {
    const requestingUserID = await getUserIdFromJwt(request.headers.jwt);

    // Retrieve details of the user who made the request
    const requestingUser = await User.findById(requestingUserID);

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

    // Check if the requesting user is already in the filtered list
    const isRequestingUserInList = filteredUsers.some((user) =>
      user._id.equals(requestingUser._id)
    );

    // If not in the list, append the requesting user
    if (!isRequestingUserInList) {
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

      // Append details of the requesting user to the filtered user list
      const usersWithRequestingUser = [...usersWithSpaceId, requestingUser];

      // Modify the request object or response object based on your filtering criteria
      request.filteredUsers = usersWithRequestingUser;
    } else {
      // If the requesting user is already in the list, use the original filteredUsers array
      request.filteredUsers = filteredUsers;
    }

    next(); // Move to the next middleware or route handler
  } catch (error) {
    handleErrors(error, request, response, next);
  }
};

const filterSpacesMiddleware = async (request, response, next) => {
  try {
    const requestingUserID = await getUserIdFromJwt(request.headers.jwt);

    const userSpaces = await getAllSpaces(requestingUserID);

    // Filter spaces where the user is an admin or part of user_ids
    const filteredSpaces = userSpaces.map((space) => {
      const {__v, ...spaceWithoutV} = space.toObject();
      return spaceWithoutV;
    });

    // Modify the request object or response object based on your filtering criteria
    request.filteredSpaces = filteredSpaces;

    next(); // Move to the next middleware or route handler
  } catch (error) {
    handleErrors(error, request, response, next);
  }
};

const filterRoomsMiddleware = async (request, response, next) => {
  try {
    const requestingUserID = await getUserIdFromJwt(request.headers.jwt);

    const userSpaces = await getAllSpaces(requestingUserID);
    const spaceIds = userSpaces.map((space) => space._id);

    // Fetch rooms with at least one matching space ID
    request.filteredRooms = await Room.find({
      space_id: {$in: spaceIds},
    });

    next();
  } catch (error) {
    handleErrors(error, request, response, next);
  }
};

const filterBookingsMiddleware = async (request, response, next) => {
  try {
    const requestingUserID = await getUserIdFromJwt(request.headers.jwt);

    const userRooms = await getAllRooms(requestingUserID);
    const roomIds = userRooms.map((room) => room._id);

    request.filteredBookings = await Booking.find({room_id: {$in: roomIds}});

    next();
  } catch (error) {
    handleErrors(error, request, response, next);
  }
};

module.exports = {
  filterUsersMiddleware,
  filterSpacesMiddleware,
  filterRoomsMiddleware,
  filterBookingsMiddleware,
};
