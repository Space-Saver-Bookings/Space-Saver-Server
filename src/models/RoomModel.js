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

RoomSchema.pre(/^find/, function (next) {
  this.populate('space_id');
  next();
});

RoomSchema.set('toJSON', {
  transform: (doc, ret) => {
    // Move the _id field to the beginning of the object
    ret = {_id: ret._id, ...ret};
    delete ret.__v;
    return ret;
  },
});

const Room = mongoose.model('Room', RoomSchema);

module.exports = {Room};
