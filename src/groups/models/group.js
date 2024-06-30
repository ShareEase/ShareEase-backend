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
  creator_name:{
    type: String,
    required: false
  },
  members: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  date: {
    type: Date,
    default: Date.now
  },
  expenses: [{
    type: Schema.Types.ObjectId,
    ref: 'Expense'
  }]
},{ timestamps: true, versionKey: false });

module.exports = mongoose.model('Group', groupSchema );
