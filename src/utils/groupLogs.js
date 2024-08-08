const GroupLog = require("../groups/models/groupLogs");

const logGroupActivity = async (groupId, activity, performedBy, details = {}) => {
  try {
    const logEntry = new GroupLog({
      groupId,
      activity,
      performedBy,
      details,
    });
    await logEntry.save();
  } catch (error) {
    return error;
  }
};

const getGroupLogs = async (groupId) => {
  try {
    const logs = await GroupLog.find({ groupId }).populate('performedBy', 'name').sort({ timestamp: -1 });
    return logs;
  } catch (error) {
    return error
  }
};

module.exports = { logGroupActivity, getGroupLogs };