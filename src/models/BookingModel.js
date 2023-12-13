const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  room_id: {
    type: mongoose.Types.ObjectId,
    ref: 'Room',
    required: true,
  },
  primary_user_id: {
    type: mongoose.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  invited_user_ids: [
    {
      type: mongoose.Types.ObjectId,
      ref: 'User',
      required: false,
    },
  ],
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  start_time: {
    type: Date,
    required: true,
  },
  end_time: {
    type: Date,
    required: true,
  },
});

BookingSchema.pre(/^find/, function (next) {
  this.populate('room_id primary_user_id invited_user_ids');
  next();
});

BookingSchema.set('toJSON', {
  transform: (doc, ret) => {
    // Move the _id field to the beginning of the object
    ret = {_id: ret._id, ...ret};
    delete ret.__v;
    return ret;
  },
});

const Booking = mongoose.model('Booking', BookingSchema);

module.exports = {Booking};
