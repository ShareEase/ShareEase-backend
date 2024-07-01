const express = require("express");
const router = express.Router();
const AuthMiddleware = require("../auth/middlewares/auth.middleware");
const NotificationController = require("./controllers/notification.controller");



router.post("/inviteUsers", [
  AuthMiddleware.validJWTNeeded,
  NotificationController.inviteUsers,
]);
router.get("/:userId", [
  AuthMiddleware.validJWTNeeded,
  NotificationController.getUserNotifications,
]);
router.delete("/:notificationId", [
  AuthMiddleware.validJWTNeeded,
  NotificationController.declineNotification,
]);



module.exports = router;
