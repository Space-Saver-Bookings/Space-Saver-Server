const mongoose = require('mongoose');

const SpaceSchema = new mongoose.Schema({
  admin_id: {
    type: String,
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
    unique: true
  },
  capacity: {
    type: Number,
    required: false,
  },
});

const Space = mongoose.model('Space', SpaceSchema);

module.exports = {Space};
