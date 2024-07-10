const express = require("express");
const router = express.Router();
const passport = require("passport");

const AuthController = require("./controllers/auth.controller");
const AuthMiddleware = require("./middlewares/auth.middleware");

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
router.get("/google/callback", AuthController.loginGoogle);
router.get(
  "/facebook",
  passport.authenticate("facebook", {
    scope: ["email"],
  })
);
router.get("/facebook/callback", AuthController.loginFacebook);
router.post("/register", AuthController.registerUser);
router.post("/googleLoginStore", AuthController.loginGoogleStore);
router.post("/login", AuthController.loginUser);

router.post("/refresh", [
  AuthMiddleware.JwtNeeded,
  AuthMiddleware.verifyRefreshBodyField,
  AuthMiddleware.validRefreshNeeded,
  AuthController.refresh_token,
]);

router.post(
  "/phoneNumber",
  AuthController.addPhoneNumberAndSendOtp
);
router.post("/verifyCode", AuthController.verifyCode);

module.exports = router;
