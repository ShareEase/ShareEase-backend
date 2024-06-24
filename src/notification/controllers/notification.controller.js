const mongoose = require("mongoose");
const User = mongoose.model("User");
const Group = require("../../groups/models/group");
const Notification = require("../model/notification");
const { sendInviteMessage } = require("../../utils/utils");

exports.inviteUsers = async (req, res) => {
  const { usersToInvite, groupId, creator_id } = req.body;
  try {
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }
    if (group.creator_id.toString() !== creator_id) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    const creator = await User.findById(creator_id);
    if (!creator) {
      return res.status(404).json({ error: "Creator not found" });
    }

    const invitePromises = usersToInvite.map(async (numbers) => {
      if (numbers === creator.phoneNumber) {
        return { success: false, message: "You cannot invite yourself" };
      }
      const user = await User.findOne({ phoneNumber: numbers });
      if (user) {
        const notification = new Notification({
          userId: user._id,
          groupId,
          message: `You have been invited to join the group ${group.name}`,
        });

        await notification.save();
        return { success: true, message: "Notification created" };
      } else {
        await sendInviteMessage(numbers);
        return { success: true, message: "Invite sent via SMS/WhatsApp" };
      }
    });

    const results = await Promise.all(invitePromises);
    res.status(200).json({ results });
  } catch (error) {
    res.status(500).json({ error: "Error inviting users", err: error });
  }
};