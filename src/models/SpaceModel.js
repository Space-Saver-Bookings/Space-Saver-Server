const mongoose = require('mongoose');

const SpaceSchema = new mongoose.Schema({
  admin_id: {
    type: mongoose.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  user_ids: {
    type: [{type: mongoose.Types.ObjectId, ref: 'User'}],
    required: false,
    default: [],
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: false,
  },
  invite_code: {
    type: String,
    required: false,
    unique: true,
  },
  capacity: {
    type: Number,
    required: false,
  },
});

// Populate fields, remove password and __v fields
SpaceSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'admin_id',
    select: '-password -__v',
  }).populate({
    path: 'user_ids',
    select: '-password -__v',
  });
  next();
});

SpaceSchema.set('toJSON', {
  transform: (doc, ret) => {
    // Move the _id field to the beginning of the object
    ret = {_id: ret._id, ...ret};
    delete ret.__v;
    return ret;
  },
});

const Space = mongoose.model('Space', SpaceSchema);

module.exports = {Space};
