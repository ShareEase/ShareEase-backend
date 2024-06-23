const jwt = require("jsonwebtoken");
const secret = process.env.JWT_SECRET;
const Group = require("../models/group");
const config = require("../../config/config");
const ADMIN = config.permissionLevels.ADMIN;

exports.onlyGroupCreatorCanEdit = (req, res, next) => {
  let userId = req.jwt.id;
  Group.findById(req.params.groupId)
    .then((group) => {
      if (!group) {
        return res.status(404).send({ error: "Group not found" });
      }
      if (
        group.creator_id.toString() === userId ||
        req.jwt.permissionLevel & ADMIN
      ) {
        return next();
      } else {
        return res
          .status(403)
          .send({ error: "Permission not granted, not creator or admin" });
      }
    })
    .catch((err) => {
      return res.status(500).send({ error: "Error finding group", err: err });
    });
};

exports.onlyGroupCreatorCanDelete = (req, res, next) => {
  let userId = req.jwt.id;
  Group.findById(req.params.groupId)
    .then((group) => {
      if (!group) {
        return res.status(404).send({ error: "Group not found" });
      }
      if (
        group.creator_id.toString() === userId ||
        req.jwt.permissionLevel & ADMIN
      ) {
        return next();
      } else {
        return res
          .status(403)
          .send({ error: "Permission not granted, not creator or admin" });
      }
    })
    .catch((err) => {
      return res.status(500).send({ error: "Error finding group", err: err });
    });
};
