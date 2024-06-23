const mongoose = require("mongoose");
const Group = require("../models/group");
const { uploadImage } = require("../../utils/utils"); // hypothetical image upload function
const User = mongoose.model("User");
const multer = require("multer");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage }).single("groupImageFile");
exports.create = (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      return res.status(500).json({ error: "Error uploading file" });
    }
    const { name, tag, creator_id } = req.body;
    const groupImageFile = req.file;
    if (!groupImageFile) {
      return res.status(400).json({ error: "No image file provided" });
    }
    uploadImage(groupImageFile, (err, url) => {
      if (err)
        return res.status(500).json({ error: "Image upload failed", err });

      const newGroup = {
        name: name,
        groupImageFile: url,
        tag: tag,
        creator_id: creator_id,
        members: [creator_id],
      };

      Group.create(newGroup)
        .then((group) => {
          User.findByIdAndUpdate(
            creator_id,
            { $push: { groups: group._id } },
            { new: true }
          )
            .then(() => {
              res.status(201).json(group);
            })
            .catch((err) => {
              res.status(500).json({ error: "Error updating user", err: err });
            });
        })
        .catch((err) => {
          res.status(500).json({ error: "Error creating group", err: err });
        });
    });
  });
};

exports.listUserGroups = (req, res) => {
  const { userId } = req.params;

  Group.find({ members: userId })
    .then((groups) => {
      res.status(200).json(groups);
    })
    .catch((err) => {
      res.status(500).json({ error: "Error fetching groups", err: err });
    });
};

exports.update = (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      return res.status(500).json({ error: "Error uploading file" });
    }
    const { groupId } = req.params;
    const updatedGroupBody = req.body;
    const groupImageFile = req.file;
    if (groupImageFile) {
      uploadImage(groupImageFile, (err, url) => {
        if (err) return res.status(500).json({ error: "Image upload failed" });

        updatedGroupBody.groupImageFile = url;
        Group.findByIdAndUpdate(groupId, updatedGroupBody, { new: true })
          .then((updatedGroup) => {
            res.status(200).json(updatedGroup);
          })
          .catch((err) => {
            res.status(500).json({ error: "Error updating group", err: err });
          });
      });
    } else {
      Group.findByIdAndUpdate(groupId, updatedGroupBody, { new: true })
        .then((updatedGroup) => {
          res.status(200).json(updatedGroup);
        })
        .catch((err) => {
          res.status(500).json({ error: "Error updating group", err: err });
        });
    }
  });
};

exports.remove = (req, res) => {
  const { creator_id } = req.body;
  const { groupId } = req.params;
  Group.findById(groupId)
    .then((group) => {
      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }
      if (group.creator_id.toString() !== creator_id) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      Group.findByIdAndRemove(groupId)
        .then(() => {
          User.findByIdAndUpdate(
            creator_id,
            { $pull: { groups: groupId } },
            { new: true }
          )
            .then(() => {
              res.status(200).json({ message: "Group deleted successfully" });
            })
            .catch((err) => {
              res.status(500).json({ error: "Error updating user", err: err });
            });
        })
        .catch((err) => {
          res.status(500).json({ error: "Error deleting group", err: err });
        });
    })
    .catch((err) => {
      res.status(500).json({ error: "Error finding group", err: err });
    });
};
