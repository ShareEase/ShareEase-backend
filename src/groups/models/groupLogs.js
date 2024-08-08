const mongoose = require("mongoose");

const groupLogSchema = new mongoose.Schema(
  {
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
    activity: { type: String, required: true },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    details: { type: Object, default: {} },
    timestamp: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

const GroupLog = mongoose.model("GroupLog", groupLogSchema);
module.exports = GroupLog;