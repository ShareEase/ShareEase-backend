const express = require("express");
const router = express.Router();
const AuthMiddleware = require("../auth/middlewares/auth.middleware");
const NotificationController = require("./controllers/notification.controller");



router.get("/:userId", [
  AuthMiddleware.validJWTNeeded,
  NotificationController.getUserNotifications,
]);
router.post("/inviteUsers", [
  AuthMiddleware.validJWTNeeded,
  NotificationController.inviteUsers,
]);

module.exports = router;
