const {getAllRooms} = require('../functions/roomFunctions');
const {getAllSpaces} = require('../functions/spaceFunctions');
const {getUserIdFromJwt} = require('../functions/userFunctions');
const {Booking} = require('../models/BookingModel');
const {Room} = require('../models/RoomModel');
const {User} = require('../models/UserModel');
const {handleErrors} = require('./sharedMiddleware');

/**
 * Middleware to filter users based on the requesting user's spaces.
 * Appends space_ids to each user object and includes the requesting user in the list.
 * @param {Object} request - Express request object.
 * @param {Object} response - Express response object.
 * @param {Function} next - Express next middleware function.
 */
const filterUsersMiddleware = async (request, response, next) => {
  try {
    const requestingUserId = await getUserIdFromJwt(request.headers.jwt);

    // Retrieve details of the user who made the request
    const requestingUser = await User.findById(requestingUserId);

    const userSpaces = await getAllSpaces(requestingUserId);

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

        // Remove __v and password fields from the user object
        const {__v, password, ...userWithoutVAndPassword} = user.toObject();

        return {...userWithoutVAndPassword, space_ids: spaceIdsForUser};
      });

      // Append details of the requesting user to the filtered user list
      const usersWithRequestingUser = [...usersWithSpaceId, requestingUser];

      // Modify the request object or response object based on filtering criteria
      request.filteredUsers = usersWithRequestingUser;
    } else {
      // If the requesting user is already in the list, use the original filteredUsers array
      request.filteredUsers = filteredUsers;
    }

    next();
  } catch (error) {
    handleErrors(error, request, response, next);
  }
};

/**
 * Middleware to filter spaces where the requesting user is an admin or part of user_ids.
 * @param {Object} request - Express request object.
 * @param {Object} response - Express response object.
 * @param {Function} next - Express next middleware function.
 */
const filterSpacesMiddleware = async (request, response, next) => {
  try {
    const requestingUserId = await getUserIdFromJwt(request.headers.jwt);

    const userSpaces = await getAllSpaces(requestingUserId);

    // Filter spaces where the user is an admin or part of user_ids
    const filteredSpaces = userSpaces.map((space) => {
      const {__v, ...spaceWithoutV} = space.toObject();
      return spaceWithoutV;
    });

    request.filteredSpaces = filteredSpaces;

    next();
  } catch (error) {
    handleErrors(error, request, response, next);
  }
};

/**
 * Middleware to filter rooms based on the requesting user's spaces.
 * @param {Object} request - Express request object.
 * @param {Object} response - Express response object.
 * @param {Function} next - Express next middleware function.
 */
const filterRoomsMiddleware = async (request, response, next) => {
  try {
    const requestingUserId = await getUserIdFromJwt(request.headers.jwt);

    const userSpaces = await getAllSpaces(requestingUserId);
    const spaceIds = userSpaces.map((space) => space._id);

    // Fetch rooms with at least one matching space Id
    request.filteredRooms = await Room.find({
      space_id: {$in: spaceIds},
    });

    next();
  } catch (error) {
    handleErrors(error, request, response, next);
  }
};

/**
 * Middleware to filter bookings based on the requesting user's rooms.
 * @param {Object} request - Express request object.
 * @param {Object} response - Express response object.
 * @param {Function} next - Express next middleware function.
 */
const filterBookingsMiddleware = async (request, response, next) => {
  try {
    const requestingUserId = await getUserIdFromJwt(request.headers.jwt);

    const userRooms = await getAllRooms(requestingUserId);
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
