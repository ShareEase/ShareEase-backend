const mongoose = require("mongoose");
const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Group",
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  read: {
    type: Boolean,
    default: false,
  },
  type: {
    type: String,
    enum: ["invite", "request", "alert"],
    required: true,
  },
},{ timestamps: true, versionKey: false });

module.exports = mongoose.model("Notification", notificationSchema);
