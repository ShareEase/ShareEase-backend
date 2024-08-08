const express = require("express");
const router = express.Router();

const AuthMiddleware = require("../auth/middlewares/auth.middleware");
const PermissionsMiddleware = require("./middlewares/group.middlewares");
const GroupsController = require("./controllers/group.controller");

router.post("/create", [
  AuthMiddleware.validJWTNeeded,
  GroupsController.create,
]);
router.post("/invite", [
  AuthMiddleware.validJWTNeeded,
  GroupsController.acceptInvite,
]);
router.post("/:groupId", [
  AuthMiddleware.validJWTNeeded,
  GroupsController.getGroupLogs,
]);
router.post("/kickUser/:groupId", [
  AuthMiddleware.validJWTNeeded,
  PermissionsMiddleware.onlyGroupCreatorCanEdit,
  GroupsController.kickUser,
]);
router.post("/leaveGroup/:groupId", [
  AuthMiddleware.validJWTNeeded,
  GroupsController.LeaveGroup,
]);
router.get("/list/:userId", [
  AuthMiddleware.validJWTNeeded,
  GroupsController.listUserGroups,
]);
router.post("/:groupId", [
  AuthMiddleware.validJWTNeeded,
  PermissionsMiddleware.onlyGroupCreatorCanEdit,
  GroupsController.update,
]);
router.delete("/:groupId", [
  AuthMiddleware.validJWTNeeded,
  PermissionsMiddleware.onlyGroupCreatorCanDelete,
  GroupsController.remove,
]);

module.exports = router;