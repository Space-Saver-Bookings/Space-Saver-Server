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

`POST /register`

### Description

Create a new user with provided details. The following fields are required in the request body:

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

## Sign In

### Endpoint

`POST /login`

### Description

Sign in an existing user by providing their email and password. Returns a JSON Web Token (JWT) for authentication.

### Request

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

## Refresh JWT

### Endpoint

`POST /token-refresh`

### Description

Extend the validity of a user's JSON Web Token (JWT) by providing the existing token. Useful for keeping the token usable for a longer time.

### Request

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

## Update User

### Endpoint

`PUT /users/:userID`

### Description

Update user information for the specified user ID. Only the user or an admin can update a user's details.

### Request

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

### Description

Delete a user by their user ID. This operation can only be performed by the user or an admin.

### Response

```json
{
  "message": "User deleted successfully"
}
```

## List All Users

### Endpoint

`GET /users`

### Description

Retrieve a list of all users registered in the system.

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

## Show Specific User

### Endpoint

`GET /users/:userID`

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

# Space Operations

## List All Spaces

### Endpoint

`GET /spaces`

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

## Show Specific Space

### Endpoint

`GET /spaces/:spaceID`

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

## Create a New Space

### Endpoint

`POST /spaces`

### Description

Create a new space with the provided details. The requesting user is automatically added as the admin of the space.

### Request

```json
{
  "name": "New Conference Room",
  "description": "State-of-the-art conference room",
  "capacity": 25,
  "user_ids": ["user_id1", "user_id2"]
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

## Join Space with Invite Code

### Endpoint

`POST /spaces/code/:invite_code`

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

## Update Space

### Endpoint

`PUT /spaces/:spaceID`

### Description

Update space information for the specified space ID. Only the admin of the space can perform this operation.

### Request

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

## Delete Space

### Endpoint

`DELETE /spaces/:spaceID`

### Description

Delete a space by its space ID. This operation can only be performed by the admin of the space.

### Response

```json
{
  "message": "Space deleted successfully"
}
```

# Room Operations

## List All Rooms

### Endpoint

`GET /rooms`

### Description

Retrieve a list of all rooms available in the system.

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
        "invite_code": "abcd1234",
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
        "invite_code": "efgh5678",
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
        "invite_code": "ijkl9012",
        "capacity": 20
      },
      "name": "Conference Room 1",
      "description": "Premium conference room with advanced amenities",
      "capacity": 18
    }
  ]
}
```

## Show Specific Room

### Endpoint

`GET /rooms/:roomID`

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
    "invite_code": "abcd1234",
    "capacity": 10
  },
  "name": "Room 101",
  "description": "Standard meeting room with projector",
  "capacity": 8
}
```

## Create a New Room

### Endpoint

`POST /rooms`

### Description

Create a new room with the provided details. The requesting user must be an administrator for the associated space.

### Request

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
      "invite_code": "abcd1234",
      "capacity": 10
    },
    "name": "New Meeting Room",
    "description": "Modern meeting room with video conferencing",
    "capacity": 12
  }
}
```

## Update Room

### Endpoint

`PUT /rooms/:roomID`

### Description

Update room information for the specified room ID. Only the administrator of the room can perform this operation.

### Request

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
    "invite_code": "abcd1234",
    "capacity": 12
  },
  "name": "Updated Lounge",
  "description": "Remodeled lounge for casual meetings",
  "capacity": 15
}
```

## Delete Room

### Endpoint

`DELETE /rooms/:roomID`

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
      "invite_code": "abcd1234",
      "capacity": 10
    },
    "name": "Updated Lounge",
    "description": "Remodeled lounge for casual meetings",
    "capacity": 15
  }
}
```

# Booking Operations

## List All Bookings

### Endpoint

`GET /bookings`

### Description

Retrieve a list of all bookings in the system.

#### Query Parameters

- `start_time` (optional): Filter bookings with start time after or equal to the specified time.
- `end_time` (optional): Filter bookings with end time before or equal to the specified time.

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

## Show Specific Booking

### Endpoint

`GET /bookings/:bookingID`

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

## Create a New Booking

### Endpoint

`POST /bookings`

### Description

Create a new booking with the provided details. The requesting user must have the necessary permissions.

### Request

```json
{
  "room_id": "room_id",
  "primary_user_id": "user_id",
  "invited_user_ids": ["user_id1", "user_id2"],
  "title": "Team Meeting",
  "description": "Discuss upcoming projects",
  "start_time": "2023-12-15T10:00:00Z",
  "end_time": "2023-12-15T11:30:00Z"
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

## Update Booking

### Endpoint

`PUT /bookings/:bookingID`

### Description

Update booking information for the specified booking ID. Only the user with the necessary permissions can perform this operation.

### Request

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

## Delete Booking

### Endpoint

`DELETE /bookings/:bookingID`

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

## List Bookings by Room and Time Range

### Endpoint

`GET /bookings/room`

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
        {"start_time": "2023-12-15T10:00:00Z", "end_time": "2023-12-15T11:30:00Z"},
        {"start_time": "2023-12-16T14:00:00Z", "end_time": "2023-12-16T16:00:00Z"}
      ]
    },
    {
      "room_id": "room_id2",
      "bookings": [
        {"start_time": "2023-12-17T09:30:00Z", "end_time": "2023-12-17T12:00:00Z"}
      ]
    }
  ]
}
```

## Retrieve Available Time Slots for a Room

### Endpoint

`GET /bookings

/available-time-slots`

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
        {"start_time": "2023-12-15T11:30:00Z", "end_time": "2023-12-16T14:00:00Z"},
        {"start_time": "2023-12-16T16:00:00Z", "end_time": "2023-12-17T09:30:00Z"}
      ]
    },
    {
      "room_id": "room_id2",
      "time_slots": [
        {"start_time": "2023-12-17T12:00:00Z", "end_time": "2023-12-18T00:00:00Z"}
      ]
    }
  ]
}
```
