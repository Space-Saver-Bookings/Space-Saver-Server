# Space-Saver-Server

MERN Space Saver Application Server

Welcome to the Space Saver Application Server! This server is the backend component of the MERN (MongoDB, Express.js, React, Node.js) stack application designed to streamline space management within organizations. Whether you're looking to coordinate meeting spaces, manage rooms, or facilitate bookings, this server provides a robust API for seamless integration.

# Table of Contents

- [User Operations](#user-operations)

  - [Create a User](#create-a-user)
  - [Sign In](#sign-in)
  - [Refresh JWT](#refresh-jwt)
  - [Update User](#update-user)
  - [Delete User](#delete-user)
  - [List All Users](#list-all-users)
  - [Show Specific User](#show-specific-user)

- [Space Operations](#space-operations)

  - [List All Spaces](#list-all-spaces)
  - [Show Specific Space](#show-specific-space)
  - [Create a New Space](#create-a-new-space)
  - [Join Space with Invite Code](#join-space-with-invite-code)
  - [Update Space](#update-space)
  - [Delete Space](#delete-space)

- [Room Operations](#room-operations)

  - [List All Rooms](#list-all-rooms)
  - [Show Specific Room](#show-specific-room)
  - [Create a New Room](#create-a-new-room)
  - [Update Room](#update-room)
  - [Delete Room](#delete-room)

- [Booking Operations](#booking-operations)
  - [List All Bookings](#list-all-bookings)
  - [Show Specific Booking](#show-specific-booking)
  - [Create a New Booking](#create-a-new-booking)
  - [Update Booking](#update-booking)
  - [Delete Booking](#delete-booking)
  - [List Bookings by Room and Time Range](#list-bookings-by-room-and-time-range)
  - [Retrieve Available Time Slots for a Room](#retrieve-available-time-slots-for-a-room)

# User Operations

## Create a User

### Endpoint

`POST /users/register`

### Authorization

Header: `jwt: jwt_token`

### Description

Create a new user with provided details. The following fields are required in the request body:

### Request Body

- `first_name` (required): String -> The first name of the user.
- `last_name` (required): String -> The last name of the user.
- `email` (required): String -> The email of the user.
- `password` (required): String -> Password of the user.
- `post_code` (required): String -> Post code of the user.
- `country` (required): String -> Country of the user.
- `position` (required): String -> Position name of the user.

### Example Request

```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "user@example.com",
  "password": "password123",
  "post_code": "12345",
  "country": "Australia",
  "position": "Developer"
}
```

### Response

```json
{
  "user": {
    "_id": "user_id",
    "first_name": "John",
    "last_name": "Doe",
    "email": "user@example.com",
    "post_code": "12345",
    "country": "Australia",
    "position": "Developer"
  }
}
```

[Back to contents](#table-of-contents)

## Sign In

### Endpoint

`POST /users/login`

### Description

Sign in an existing user by providing their email and password. Returns a JSON Web Token (JWT) for authentication.

### Request Body

- `email` (required): String -> Email of the user.
- `password` (required): String -> Password of the user.

### Example Request

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Response

```json
{
  "jwt": "encrypted_user_jwt"
}
```

[Back to contents](#table-of-contents)

## Refresh JWT

### Endpoint

`POST /users/token-refresh`

### Description

Extend the validity of a user's JSON Web Token (JWT) by providing the existing token. Useful for keeping the token usable for a longer time.

### Request Body

- `jwt` (required): String -> JWT result of user login.

### Example Request

```json
{
  "jwt": "your_existing_jwt_token"
}
```

### Response

```json
{
  "jwt": "refreshed_jwt_token"
}
```

[Back to contents](#table-of-contents)

## Update User

### Endpoint

`PUT /users/:userID`

### Authorization

Header: `jwt: jwt_token`

### Description

Update user information for the specified user ID. This operation can only be performed by the user.

### Request Body

- `first_name` (optional): String -> First name of the user.
- `last_name` (optional): String -> Last name of the user.
- `email` (optional): String -> Email of the user.
- `password` (optional): String -> Password of the user.
- `post_code` (optional): String -> Post code of the user.
- `country` (optional): String -> Country of the user.
- `position` (optional): String -> Position name or role description of the user.

### Example Request

```json
{
  "first_name": "Updated",
  "last_name": "User",
  "email": "updated@example.com",
  "password": "newpassword123",
  "post_code": "54321",
  "country": "New Zealand",
  "position": "Senior Developer"
}
```

### Response

```json
{
  "_id": "user_id",
  "first_name": "Updated",
  "last_name": "User",
  "email": "updated@example.com",
  "post_code": "54321",
  "country": "New Zealand",
  "position": "Senior Developer"
}
```

## Delete User

### Endpoint

`DELETE /users/:userID`

### Authorization

Header: `jwt: jwt_token`

### Description

Delete a user by their user ID. This operation can only be performed by the user.

### Response

```json
{
  "message": "User deleted successfully"
}
```

[Back to contents](#table-of-contents)

## List All Users

### Endpoint

`GET /users`

### Authorization

Header: `jwt: jwt_token`

### Description

Retrieve a list of users within the same space(s) as the authenticated user.

### Response

```json
{
  "userCount": 3,
  "users": [
    {
      "_id": "user_id1",
      "first_name": "John",
      "last_name": "Doe",
      "email": "user1@example.com",
      "post_code": "12345",
      "country": "Australia",
      "position": "Developer"
    },
    {
      "_id": "user_id2",
      "first_name": "Jane",
      "last_name": "Doe",
      "email": "user2@example.com",
      "post_code": "54321",
      "country": "New Zealand",
      "position": "Senior Developer"
    },
    {
      "_id": "user_id3",
      "first_name": "Bob",
      "last_name": "Smith",
      "email": "user3@example.com",
      "post_code": "67890",
      "country": "Canada",
      "position": "Tester"
    }
  ]
}
```

[Back to contents](#table-of-contents)

## Show Specific User

### Endpoint

`GET /users/:userID`

### Authorization

Header: `jwt: jwt_token`

### Description

Retrieve information about a specific user using their user ID.

### Response

```json
{
  "_id": "user_id",
  "first_name": "John",
  "last_name": "Doe",
  "email": "user@example.com",
  "post_code": "12345",
  "country": "Australia",
  "position": "Developer"
}
```

[Back to contents](#table-of-contents)

# Space Operations

## List All Spaces

### Endpoint

`GET /spaces`

### Authorization

Header: `jwt: jwt_token`

### Description

Retrieve a list of all spaces available in the system.

### Response

```json
{
  "spaceCount": 3,
  "spaces": [
    {
      "_id": "space_id1",
      "admin_id": "user_id1",
      "user_ids": ["user_id1", "user_id2"],
      "name": "Meeting Room A",
      "description": "A cozy meeting room with whiteboard",
      "invite_code": "abcd1234",
      "capacity": 10
    },
    {
      "_id": "space_id2",
      "admin_id": "user_id3",
      "user_ids": ["user_id3", "user_id4"],
      "name": "Office Lounge",
      "description": "Relaxing lounge for informal meetings",
      "invite_code": "efgh5678",
      "capacity": 15
    },
    {
      "_id": "space_id3",
      "admin_id": "user_id5",
      "user_ids": ["user_id5"],
      "name": "Conference Room B",
      "description": "Large conference room with AV facilities",
      "invite_code": "ijkl9012",
      "capacity": 20
    }
  ]
}
```

[Back to contents](#table-of-contents)

## Show Specific Space

### Endpoint

`GET /spaces/:spaceID`

### Authorization

Header: `jwt: jwt_token`

### Description

Retrieve information about a specific space using its space ID.

### Response

```json
{
  "_id": "space_id",
  "admin_id": "user_id",
  "user_ids": ["user_id", "user_id2"],
  "name": "Meeting Room A",
  "description": "A cozy meeting room with whiteboard",
  "invite_code": "abcd1234",
  "capacity": 10
}
```

[Back to contents](#table-of-contents)

## Create a New Space

### Endpoint

`POST /spaces`

### Authorization

Header: `jwt: jwt_token`

### Description

Create a new space with the provided details. The requesting user is automatically added as the admin of the space.

### Request Body

- `name` (required): String -> The name of the Space.
- `description` (required): String -> Description of the new Space.
- `capacity` (required): Integer -> Capacity of the Space.

### Example Request

```json
{
  "name": "New Conference Room",
  "description": "State-of-the-art conference room",
  "capacity": 25
}
```

### Response

```json
{
  "space": {
    "_id": "new_space_id",
    "admin_id": "requesting_user_id",
    "user_ids": ["requesting_user_id", "user_id1", "user_id2"],
    "name": "New Conference Room",
    "description": "State-of-the-art conference room",
    "invite_code": "generated_invite_code",
    "capacity": 25
  }
}
```

[Back to contents](#table-of-contents)

## Join Space with Invite Code

### Endpoint

`POST /spaces/code/:invite_code`

### Authorization

Header: `jwt: jwt_token`

### Description

Add the requesting user to a space using the invite code.

### Response

```json
{
  "message": "User joined space successfully",
  "space": {
    "_id": "space_id",
    "admin_id": "admin_user_id",
    "user_ids": ["admin_user_id", "requesting_user_id", "user_id1", "user_id2"],
    "name": "Meeting Room A",
    "description": "A cozy meeting room with whiteboard",
    "invite_code": "abcd1234",
    "capacity": 10
  }
}
```

[Back to contents](#table-of-contents)

## Update Space

### Endpoint

`PUT /spaces/:spaceID`

### Authorization

Header: `jwt: jwt_token`

### Description

Update space information for the specified space ID. Only the admin of the space can perform this operation.

### Request Body

- `admin_id` (optional): String -> The unique ID of the to be updated admin.
- `user_ids` (optional): Array -> Unique IDs of all of the users in the Space.
- `name` (optional): String -> The name of the Space.
- `description` (optional): String -> Description of the new Space.
- `capacity` (optional): Integer -> Capacity of the Space.

### Example Request

```json
{
  "admin_id": "new_admin_user_id",
  "user_ids": ["new_user_id1", "new_user_id2"],
  "name": "Updated Meeting Room",
  "description": "Renovated meeting room with enhanced features",
  "capacity": 15
}
```

### Response

```json
{
  "_id": "space_id",
  "admin_id": "new_admin_user_id",
  "user_ids": ["new_admin_user_id", "new_user_id1", "new_user_id2"],
  "name": "Updated Meeting Room",
  "description": "Renovated meeting room with enhanced features",
  "invite_code": "abcd1",
  "capacity": 15
}
```

[Back to contents](#table-of-contents)

## Delete Space

### Endpoint

`DELETE /spaces/:spaceID`

### Authorization

Header: `jwt: jwt_token`

### Description

Delete a space by its space ID. This operation can only be performed by the admin of the space.

### Response

```json
{
  "message": "Space deleted successfully"
}
```

[Back to contents](#table-of-contents)

# Room Operations

## List All Rooms

### Endpoint

`GET /rooms`

### Authorization

Header: `jwt: jwt_token`

### Description

Retrieve a list of rooms within the same space(s) as the authenticated user.

### Response

```json
{
  "roomCount": 3,
  "rooms": [
    {
      "_id": "room_id1",
      "space_id": {
        "_id": "space_id1",
        "admin_id": "user_id1",
        "user_ids": ["user_id1", "user_id2"],
        "name": "Meeting Room A",
        "description": "A cozy meeting room with whiteboard",
        "invite_code": "aBcd1",
        "capacity": 10
      },
      "name": "Room 101",
      "description": "Standard meeting room with projector",
      "capacity": 8
    },
    {
      "_id": "room_id2",
      "space_id": {
        "_id": "space_id2",
        "admin_id": "user_id3",
        "user_ids": ["user_id3", "user_id4"],
        "name": "Office Lounge",
        "description": "Relaxing lounge for informal meetings",
        "invite_code": "Ef678",
        "capacity": 15
      },
      "name": "Lounge Room",
      "description": "Casual lounge for team discussions",
      "capacity": 12
    },
    {
      "_id": "room_id3",
      "space_id": {
        "_id": "space_id3",
        "admin_id": "user_id5",
        "user_ids": ["user_id5"],
        "name": "Conference Room B",
        "description": "Large conference room with AV facilities",
        "invite_code": "iJkl9",
        "capacity": 20
      },
      "name": "Conference Room 1",
      "description": "Premium conference room with advanced amenities",
      "capacity": 18
    }
  ]
}
```

[Back to contents](#table-of-contents)

## Show Specific Room

### Endpoint

`GET /rooms/:roomID`

### Authorization

Header: `jwt: jwt_token`

### Description

Retrieve information about a specific room using its room ID.

### Response

```json
{
  "_id": "room_id",
  "space_id": {
    "_id": "space_id",
    "admin_id": "admin_user_id",
    "user_ids": ["admin_user_id", "user_id1", "user_id2"],
    "name": "Meeting Room A",
    "description": "A cozy meeting room with whiteboard",
    "invite_code": "abCd1",
    "capacity": 10
  },
  "name": "Room 101",
  "description": "Standard meeting room with projector",
  "capacity": 8
}
```

[Back to contents](#table-of-contents)

## Create a New Room

### Endpoint

`POST /rooms`

### Authorization

Header: `jwt: jwt_token`

### Description

Create a new room with the provided details. The requesting user must be an administrator for the associated space.

### Request Body

- `space_id` (required): String -> The unique ID of the Space where the room is located.
- `name` (required): String -> The name of the room.
- `description` (required): String -> Description of the new room.
- `capacity` (required): Integer -> Capacity of the room.

### Example Request

```json
{
  "space_id": "space_id",
  "name": "New Meeting Room",
  "description": "Modern meeting room with video conferencing",
  "capacity": 12
}
```

### Response

```json
{
  "room": {
    "_id": "new_room_id",
    "space_id": {
      "_id": "space_id",
      "admin_id": "requesting_user_id",
      "user_ids": ["requesting_user_id", "user_id1", "user_id2"],
      "name": "Meeting Room A",
      "description": "A cozy meeting room with whiteboard",
      "invite_code": "AbcD1",
      "capacity": 10
    },
    "name": "New Meeting Room",
    "description": "Modern meeting room with video conferencing",
    "capacity": 12
  }
}
```

[Back to contents](#table-of-contents)

## Update Room

### Endpoint

`PUT /rooms/:roomID`

### Authorization

Header: `jwt: jwt_token`

### Description

Update room information for the specified room ID. Only the administrator of the room can perform this operation.

### Request Body

- `space_id` (optional): String -> The unique ID of the Space where the room is located.
- `name` (optional): String -> The name of the room.
- `description` (optional): String -> Description of the new room.
- `capacity` (optional): Integer -> Capacity of the room.

### Example Request

```json
{
  "space_id": "new_space_id",
  "name": "Updated Lounge",
  "description": "Remodeled lounge for casual meetings",
  "capacity": 15
}
```

### Response

```json
{
  "_id": "room_id",
  "space_id": {
    "_id": "new_space_id",
    "admin_id": "admin_user_id",
    "user_ids": ["admin_user_id", "user_id1", "user_id2"],
    "name": "New Meeting Room",
    "description": "Modern meeting room with video conferencing",
    "invite_code": "D1234",
    "capacity": 12
  },
  "name": "Updated Lounge",
  "description": "Remodeled lounge for casual meetings",
  "capacity": 15
}
```

[Back to contents](#table-of-contents)

## Delete Room

### Endpoint

`DELETE /rooms/:roomID`

### Authorization

Header: `jwt: jwt_token`

### Description

Delete a room by its room ID. This operation can only be performed by the administrator of the room.

### Response

```json
{
  "message": "Room deleted successfully",
  "room": {
    "_id": "room_id",
    "space_id": {
      "_id": "space_id",
      "admin_id": "admin_user_id",
      "user_ids": ["admin_user_id", "user_id1", "user_id2"],
      "name": "Meeting Room A",
      "description": "A cozy meeting room with whiteboard",
      "invite_code": "1234a",
      "capacity": 10
    },
    "name": "Updated Lounge",
    "description": "Remodeled lounge for casual meetings",
    "capacity": 15
  }
}
```

[Back to contents](#table-of-contents)

# Booking Operations

## List All Bookings

### Endpoint

`GET /bookings`

### Authorization

Header: `jwt: jwt_token`

### Description

Retrieve a list of bookings within the same space(s) as the authenticated user.

#### Query Parameters

- `start_time` (optional, datetime (yyyy-MM-ddThh:mm:ss.SSSZ)): Filter bookings with start time after or equal to the specified time.
- `end_time` (optional, datetime (yyyy-MM-ddThh:mm:ss.SSSZ)): Filter bookings with end time before or equal to the specified time.
- `primary_user` (optional, boolean): Filter bookings where the current user is the primary user.
- `invited_user` (optional, boolean): Filter bookings where the current user is invited.

#### Example:

To retrieve bookings where the current user is the primary user, include the query parameter `primary_user=true`:

```plaintext
GET /bookings?primary_user=true
```

To retrieve bookings where the current user is both the primary user and invited, and the booking starts between `2023-12-16T00:20:09.489Z` and ends before `2023-12-16T23:27:09.488Z`, use the following example:

```plaintext
GET /bookings?primary_user=true&invited_user=true&start_time=2023-12-16T00:20:09.489Z&end_time=2023-12-16T23:27:09.488Z
```

### Response

```json
{
  "bookingCount": 3,
  "bookings": [
    {
      "_id": "booking_id1",
      "room_id": "room_id1",
      "primary_user_id": "user_id1",
      "invited_user_ids": ["user_id2", "user_id3"],
      "title": "Team Meeting",
      "description": "Discuss upcoming projects",
      "start_time": "2023-12-15T10:00:00Z",
      "end_time": "2023-12-15T11:30:00Z"
    },
    {
      "_id": "booking_id2",
      "room_id": "room_id2",
      "primary_user_id": "user_id4",
      "invited_user_ids": ["user_id5"],
      "title": "Client Presentation",
      "description": "Showcase new features",
      "start_time": "2023-12-16T14:00:00Z",
      "end_time": "2023-12-16T16:00:00Z"
    },
    {
      "_id": "booking_id3",
      "room_id": "room_id3",
      "primary_user_id": "user_id6",
      "invited_user_ids": ["user_id7", "user_id8"],
      "title": "Training Session",
      "description": "Onboarding new team members",
      "start_time": "2023-12-17T09:30:00Z",
      "end_time": "2023-12-17T12:00:00Z"
    }
  ]
}
```

[Back to contents](#table-of-contents)

## Show Specific Booking

### Endpoint

`GET /bookings/:bookingID`

### Authorization

Header: `jwt: jwt_token`

### Description

Retrieve information about a specific booking using its booking ID.

### Response

```json
{
  "_id": "booking_id",
  "room_id": "room_id",
  "primary_user_id": "user_id",
  "invited_user_ids": ["user_id1", "user_id2"],
  "title": "Team Meeting",
  "description": "Discuss upcoming projects",
  "start_time": "2023-12-15T10:00:00Z",
  "end_time": "2023-12-15T11:30:00Z"
}
```

[Back to contents](#table-of-contents)

## Create a New Booking

### Endpoint

`POST /bookings`

### Authorization

Header: `jwt: jwt_token`

### Request Body

- `room_id` (required): The ID of the room for the booking.
- `title` (required): The title of the booking.
- `primary_user_id` (optional): The ID of the primary user for the booking. If not provided, it will default to the current logged-in user.
- `invited_user_ids` (optional): An array of user IDs invited to the booking.
- `description` (required): Description for the booking.
- `start_time` (required): The start time of the booking.
- `end_time` (required): The end time of the booking.

### Example Request

```json
{
  "room_id": "your_room_id",
  "title": "Meeting 1",
  "primary_user_id": "optional_primary_user_id",
  "invited_user_ids": ["user_id1", "user_id2"],
  "description": "This is Meeting 1",
  "start_time": "2023-01-01T08:00:00.000Z",
  "end_time": "2023-01-01T09:00:00.000Z"
}
```

### Response

```json
{
  "booking": {
    "_id": "new_booking_id",
    "room_id": "room_id",
    "primary_user_id": "user_id",
    "invited_user_ids": ["user_id1", "user_id2"],
    "title": "Team Meeting",
    "description": "Discuss upcoming projects",
    "start_time": "2023-12-15T10:00:00Z",
    "end_time": "2023-12-15T11:30:00Z"
  }
}
```

[Back to contents](#table-of-contents)

## Update Booking

### Endpoint

`PUT /bookings/:bookingID`

### Authorization

Header: `jwt: jwt_token`

### Description

Update booking information for the specified booking ID. Only the user with the necessary permissions can perform this operation.

### Request Body

- `room_id` (optional): String -> The ID of the room for the booking.
- `primary_user_id` (optional): String -> The ID of the primary user for the booking.
- `invited_user_ids` (optional): Array of Strings -> An array of user IDs invited to the booking.
- `title` (optional): String -> The title of the booking.
- `description` (optional): String -> Description for the booking.
- `start_time` (optional): String -> The start time of the booking.
- `end_time` (optional): String -> The end time of the booking.

### Example Request

```json
{
  "room_id": "new_room_id",
  "primary_user_id": "new_user_id",
  "invited_user_ids": ["user_id3", "user_id4"],
  "title": "Updated Team Meeting",
  "description": "Discuss revised project timelines",
  "start_time": "2023-12-15T11:00:00Z",
  "end_time": "2023-12-15T12:30:00Z"
}
```

### Response

```json
{
  "_id": "booking_id",
  "room_id": "new_room_id",
  "primary_user_id": "new_user_id",
  "invited_user_ids": ["user_id3", "user_id4"],
  "title": "Updated Team Meeting",
  "description": "Discuss revised project timelines",
  "start_time": "2023-12-15T11:00:00Z",
  "end_time": "2023-12-15T12:30:00Z"
}
```

[Back to contents](#table-of-contents)

## Delete Booking

### Endpoint

`DELETE /bookings/:bookingID`

### Authorization

Header: `jwt: jwt_token`

### Description

Delete a booking by its booking ID. This operation can only be performed by the user with the necessary permissions.

### Response

```json
{
  "message": "Booking deleted successfully",
  "booking": {
    "_id": "booking_id",
    "room_id": "room_id",
    "primary_user_id": "user_id",
    "invited_user_ids": ["user_id1", "user_id2"],
    "title": "Team Meeting",
    "description": "Discuss upcoming projects",
    "start_time": "2023-12-15T10:00:00Z",
    "end_time": "2023-12-15T11:30:00Z"
  }
}
```

[Back to contents](#table-of-contents)

## List Bookings by Room and Time Range

### Endpoint

`GET /bookings/room`

### Authorization

Header: `jwt: jwt_token`

### Description

Retrieve bookings per room within the specified time range.

#### Query Parameters

- `start_time` (optional): Filter bookings with start time after or equal to the specified time.
- `end_time` (optional): Filter bookings with end time before or equal to the specified time.

### Response

```json
{
  "bookingsPerRoom": [
    {
      "room_id": "room_id1",
      "bookings": [
        {
          "start_time": "2023-12-15T10:00:00Z",
          "end_time": "2023-12-15T11:30:00Z"
        },
        {
          "start_time": "2023-12-16T14:00:00Z",
          "end_time": "2023-12-16T16:00:00Z"
        }
      ]
    },
    {
      "room_id": "room_id2",
      "bookings": [
        {
          "start_time": "2023-12-17T09:30:00Z",
          "end_time": "2023-12-17T12:00:00Z"
        }
      ]
    }
  ]
}
```

[Back to contents](#table-of-contents)

## Retrieve Available Time Slots for a Room

### Endpoint

`GET /bookings/available-time-slots`

### Authorization

Header: `jwt: jwt_token`

### Description

Retrieve available time slots for a room within the specified time range.

#### Query Parameters

- `start_time` (optional): Start time to begin checking available time slots.
- `end_time` (optional): End time to stop checking available time slots.
- `interval` (optional): Time interval in minutes for available time slots. Default is 30 minutes.

### Response

```json
{
  "availableTimeSlots": [
    {
      "room_id": "room_id1",
      "time_slots": [
        {
          "available_start_time": "2023-12-17T00:00:05.000Z",
          "available_end_time": "2023-12-17T01:00:05.000Z"
        },
        {
          "available_start_time": "2023-12-17T01:00:05.000Z",
          "available_end_time": "2023-12-17T02:00:05.000Z"
        }
      ]
    },
    {
      "room_id": "room_id2",
      "time_slots": [
        {
          "available_start_time": "2023-12-17T02:00:05.000Z",
          "available_end_time": "2023-12-17T03:00:05.000Z"
        }
      ]
    }
  ],
  "mostUsedRoom": "room_id2",
  "numberOfRoomsInUse": 2,
  "numberOfUsersInRooms": {
    "numberOfPrimaryUsers": 2,
    "numberOfInvitedUsers": 1,
    "totalNumberOfUsers": 3
  }
}
```

[Back to contents](#table-of-contents)
