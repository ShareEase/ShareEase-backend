const mongoose = require("mongoose");
const Group = require("../models/group");
const { uploadImage } = require("../../utils/utils"); // hypothetical image upload function
const User = mongoose.model("User");
const multer = require("multer");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage }).single("groupImageFile");

exports.create = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(500).json({ error: "Error uploading file" });
    }
    const { name, tag, creator_id, groupImageFile } = req.body;

    const createGroup = async (imageUrl = null) => {
      try {
        const userInfo = await User.findById(creator_id);
        if (!userInfo) {
          return res.status(404).json({ error: "User not found" });
        }

        const newGroup = {
          name: name,
          groupImageFile: imageUrl,
          tag: tag,
          creator_id: creator_id,
          members: [creator_id],
          creator_name: userInfo.name,
        };

        const group = await Group.create(newGroup);
        if (!userInfo.groups) {
          userInfo.groups = [];
        }
        if (!userInfo.groups.includes(group._id)) {
          userInfo.groups.push(group._id);
          await userInfo.save();
        }
        const groupMembers = await User.find({
          _id: { $in: group.members },
        }).select("_id name email profilePicture");
        const groupWithMembers = {
          ...group.toObject(),
          members: groupMembers,
        };
        res.status(201).json({
          success: true,
          message: "Group created successfully",
          group: groupWithMembers,
        });
      } catch (error) {
        res.status(500).json({
          error: "Error processing request",
          details: error.message,
          stack: error.stack,
        });
      }
    };

    if (groupImageFile && groupImageFile.data) {
      const buffer = Buffer.from(groupImageFile.data, "base64");
      const tempFile = {
        buffer: buffer,
        originalname: groupImageFile.name,
        mimetype: groupImageFile.type,
      };
      uploadImage(tempFile, (err, url) => {
        if (err)
          return res.status(500).json({ error: "Image upload failed", err });
        createGroup(url);
      });
    } else {
      createGroup();
    }
  });
};

exports.listUserGroups = async (req, res) => {
  const { userId } = req.params;
  try {
    await Group.createIndexes({ creator_id: 1 });
    await User.createIndexes({ _id: 1 });

    const groups = await Group.aggregate([
      { $match: { creator_id: mongoose.Types.ObjectId(userId) } },
      {
        $lookup: {
          from: "users",
          localField: "members",
          foreignField: "_id",
          as: "members",
          pipeline: [
            {
              $project: {
                _id: 1,
                name: 1,
                profilePicture: 1,
              },
            },
          ],
        },
      },
      {
        $addFields: {
          members: {
            $map: {
              input: "$members",
              as: "member",
              in: {
                _id: "$$member._id",
                name: "$$member.name",
                profilePicture: "$$member.profilePicture",
                isCreator: { $eq: ["$$member._id", "$creator_id"] },
              },
            },
          },
        },
      },
    ]).exec();

    res.status(200).json({
      success: true,
      message: "Groups fetched successfully",
      groups: groups,
    });
  } catch (err) {
    res.status(500).json({ error: "Error fetching groups", err });
  }
};

exports.update = (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      return res.status(500).json({ error: "Error uploading file" });
    }
    const { groupId } = req.params;
    const updatedGroupBody = req.body;

    const updateGroup = async (imageUrl = null) => {
      try {
        if (imageUrl) {
          updatedGroupBody.groupImageFile = imageUrl;
        }
        const updatedGroup = await Group.findByIdAndUpdate(
          groupId,
          updatedGroupBody,
          { new: true }
        );
        if (!updatedGroup) {
          return res.status(404).json({ error: "Group not found" });
        }
        const groupMembers = await User.find({
          _id: { $in: updatedGroup.members },
        }).select("_id name email profilePicture");
        const groupWithMembers = {
          ...updatedGroup.toObject(),
          members: groupMembers,
        };

        res.status(200).json({
          success: true,
          message: "Group updated successfully",
          group: groupWithMembers,
        });
      } catch (error) {
        res.status(500).json({
          error: "Error updating group",
          details: error.message,
          stack: error.stack,
        });
      }
    };

    if (
      updatedGroupBody.groupImageFile &&
      updatedGroupBody.groupImageFile.data
    ) {
      const buffer = Buffer.from(groupImageFile.data, "base64");
      const tempFile = {
        buffer: buffer,
        originalname: groupImageFile.name,
        mimetype: groupImageFile.type,
      };
      uploadImage(tempFile, (err, url) => {
        if (err) return res.status(500).json({ error: "Image upload failed" });
        updateGroup(url);
      });
    } else {
      updateGroup();
    }
  });
};

exports.remove = async (req, res) => {
  const { creator_id } = req.body;
  const { groupId } = req.params;

  try {
    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }
    if (group.creator_id.toString() !== creator_id) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    await Group.findByIdAndRemove(groupId);
    const result = await User.updateMany({}, [
      {
        $set: {
          groups: {
            $filter: {
              input: "$groups",
              cond: { $ne: [{ $toString: "$$this" }, groupId] },
            },
          },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      message: "Group deleted successfully",
      usersUpdated: result.modifiedCount,
    });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Error processing request", details: err.message });
  }
};

exports.acceptInvite = async (req, res) => {
  const { userId, groupId } = req.body;

  try {
    const [group, user] = await Promise.all([
      Group.findById(groupId),
      User.findById(userId),
    ]);

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    if (group.members.includes(userId)) {
      return res.status(400).json({ error: "User already in group" });
    }
    group.members.push(userId);
    if (!user.groups) {
      user.groups = [groupId];
    } else if (!user.groups.includes(groupId)) {
      user.groups.push(groupId);
    }

    await Promise.all([group.save(), user.save()]);
    const updatedGroup = await Group.findById(groupId)
      .populate("members", "_id name profilePicture")
      .lean();

    const groupWithMemberDetails = {
      ...updatedGroup,
      members: updatedGroup.members.map((member) => ({
        _id: member._id,
        name: member.name,
        profilePicture: member.profilePicture,
        isCreator: member._id.toString() === updatedGroup.creator_id.toString(),
      })),
    };

    res.status(200).json({
      success: true,
      message: "User added successfully",
      group: groupWithMemberDetails,
    });
  } catch (err) {
    res.status(500).json({
      error: "Error processing request",
      details: err.message,
      stack: err.stack,
    });
  }
};


exports.kickUser = async (req, res) => {
  const { userId } = req.body;
  const { groupId } = req.params;
  try {
    const [group, user] = await Promise.all([
      Group.findById(groupId),
      User.findById(userId),
    ]);

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    if (!group.members.includes(userId)) {
      return res.status(400).json({ error: "User not in group" });
    }
    if (group.creator_id.toString() === userId) {
      return res.status(400).json({ error: "Cannot kick group creator" });
    }

    group.members = group.members.filter((member) => member.toString() !== userId);
    user.groups = user.groups.filter((group) => group.toString() !== groupId);

    await Promise.all([group.save(), user.save()]);
    const updatedGroup = await Group.findById(groupId)
      .populate("members", "_id name profilePicture")
      .lean();

    const groupWithMemberDetails = {
      ...updatedGroup,
      members: updatedGroup.members.map((member) => ({
        _id: member._id,
        name: member.name,
        profilePicture: member.profilePicture,
        isCreator: member._id.toString() === updatedGroup.creator_id.toString(),
      })),
    };

    res.status(200).json({
      success: true,
      message: "User removed successfully",
      group: groupWithMemberDetails,
    });
  }
  catch (err) {
    res.status(500).json({
      error: "Error processing request",
      details: err.message,
      stack: err.stack,
    });
  }
}
