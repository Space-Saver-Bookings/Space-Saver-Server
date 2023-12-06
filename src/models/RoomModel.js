const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  space_id: {
    type: mongoose.Types.ObjectId,
    ref: 'Space',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: false,
  },
  capacity: {
    type: Number,
    required: true,
  },
});

const Room = mongoose.model('Room', RoomSchema);

module.exports = {Room};
