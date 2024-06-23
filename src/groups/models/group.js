const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const groupSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  groupImageFile: {
    type: String,
    required: false,
    default: ""
  },
  tag: {
    type: String,
    required: false,
    default: ""
  },
  creator_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Group', groupSchema );
