const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const validateRegisterInput = require("../validation/register");
const validateLoginInput = require("../validation/login");
const passport = require("passport");
const Validator = require("validator");
const mongoose = require("mongoose");
var User = mongoose.model("User");
const UsersController = require("../../users/controllers/users.controller");
require("dotenv").config();
const { verifyOTP, sendOTP } = require("../../utils/utils");

exports.generateTokens = (user) => {
  return new Promise((resolve, reject) => {
    let refreshId = user.id + process.env.JWT_SECRET;
    bcrypt.genSalt(10, function (err, salt) {
      bcrypt.hash(refreshId, salt, function (err, refresh_token) {
        jwt.sign(
          user,
          process.env.JWT_SECRET,
          {
            expiresIn: 60 * 60,
          },
          (err, jwttoken) => {
            if (err) {
              reject(err);
            }
            resolve([jwttoken, refresh_token]);
          }
        );
      });
    });
  });
};

exports.refresh_token = (req, res) => {
  try {
    req.body = req.jwt;
    const userId = req.body.id;

    User.findOne({ _id: userId }).then((user) => {
      if (!user) {
        return res.status(404).json({ auth: "Email not found" });
      }
      const payload = {
        id: user.id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
        permissionLevel: user.permissionLevel,
      };
      this.generateTokens(payload)
        .then(([token, refresh_token]) => {
          res.status(200).json({
            success: true,
            token: "Bearer " + token,
            refresh_token: refresh_token,
          });
        })
        .catch((err) => {
          return res.status(400).send({ error: "Error", err: err });
        });
    });
  } catch (err) {
    res.status(500).send({ errors: err });
  }
};

exports.registerUser = async (req, res) => {
  const { errors, isValid } = await validateRegisterInput(req.body);

  if (!isValid) {
    return res.status(400).json(errors);
  }

  return UsersController.insert(req, res);
};

exports.loginUser = async (req, res) => {
  const { errors, isValid } = validateLoginInput(req.body);

  if (!isValid) {
    return res.status(400).json(errors);
  }

  const emailOrUsername = req.body.email;
  const password = req.body.password;
  const query = Validator.isEmail(emailOrUsername) ? { email: emailOrUsername } : { username: emailOrUsername };

  try {
    const user = await User.findOne(query).select("+password");

    if (!user) {
      return res.status(404).json({ auth: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      const payload = {
        id: user.id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
        permissionLevel: user.permissionLevel,
        phoneNumberVerified: user.phoneNumberVerified,
      };

      const [token] = await this.generateTokens(payload);

      const updatedUser = await User.findByIdAndUpdate(user.id, { token: token }, { new: true });

      return res.status(200).json({
        success: true,
        message: "User logged in successfully",
        token: "Bearer " + token,
        user: updatedUser,
      });
    } else {
      return res.status(400).send({ error: "Password incorrect" });
    }
  } catch (err) {
    return res.status(500).json({ error: "Error processing login", err: err });
  }
};

exports.loginGoogle = (req, res, next) => {
  const generateTokens = this.generateTokens;
  passport.authenticate("google", function (err, user, info) {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.redirect("/login");
    }
    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      profilePicture: user.profilePicture,
      permissionLevel: user.permissionLevel,
    };
    generateTokens(payload)
      .then(([token, refresh_token]) => {
        return res.redirect(
          `http://localhost:3000/login?token=${token}&refresh_token=${refresh_token}`
        );
      })
      .catch((err) => {
        return res.status(400).send({ error: "Error", err: err });
      });
  })(req, res, next);
};

exports.loginFacebook = (req, res, next) => {
  const generateTokens = this.generateTokens;
  passport.authenticate("facebook", function (err, user, info) {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.redirect("/login");
    }
    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      profilePicture: user.profilePicture,
      permissionLevel: user.permissionLevel,
    };
    generateTokens(payload)
      .then(([token, refresh_token]) => {
        return res.redirect(
          `http://localhost:3000/login?token=${token}&refresh_token=${refresh_token}`
        );
      })
      .catch((err) => {
        return res.status(400).send({ error: "Error", err: err });
      });
  })(req, res, next);
};

const updateUserAndRespond = async (user, token, id, res) => {
  const payload = {
    id: user.id,
    name: user.name,
    email: user.email,
    profilePicture: user.profilePicture,
    permissionLevel: user.permissionLevel,
  };
  try {
    const [newToken, refreshToken] = await this.generateTokens(payload);
    user.token = newToken;
    user.refresh_token = refreshToken;
    user.OAuthId = id;
    await user.save();
    return res
      .status(200)
      .send({ message: "User logged in successfully", user });
  } catch (err) {
    return res.status(400).send({ error: "Error", err });
  }
};

exports.loginGoogleStore = async (req, res, next) => {
  const { token, user } = req.body;
  if (!token || !user) {
    return res.status(400).send({ error: "Token and user data are required" });
  }
  const { id, name, email, profilePicture, permissionLevel } = user;
  try {
    let existingUser = await User.findOne({ email });

    if (existingUser) {
      await updateUserAndRespond(existingUser, token, id, res);
    } else {
      const newUser = new User({
        name,
        email,
        profilePicture,
        permissionLevel,
        token: token,
        OAuthId: id,
      });
      await updateUserAndRespond(newUser, token, id, res);
    }
  } catch (err) {
    return res.status(500).send({ error: "Internal server error", err });
  }
};

exports.addPhoneNumberAndSendOtp = (req, res) => {
  const userId = req.body.userId;
  const phoneNumber = req.body.phoneNumber;

  User.findOne({ _id: userId })
    .then((user) => {
      if (!user) {
        return res.status(404).json({ auth: "User not found" });
      }

      user.phoneNumber = phoneNumber;
      user.save().then(async (updatedUser) => {
        const verification = await sendOTP(phoneNumber);
      });
    })
    .catch((err) => {
      res.status(500).json({ error: "Server error", details: err });
    });
};
exports.verifyCode = (req, res) => {
  const userId = req.body.userId;
  const phoneNumber = req.body.phoneNumber;
  const code = req.body.code;

  User.findOne({ _id: userId })
    .then(async (user) => {
      if (!user) {
        return res.status(404).json({ auth: "User not found" });
      }

      const verification = await verifyOTP(phoneNumber);

      if (!verification.valid) {
        return res.status(400).json({ message: "Invalid OTP" });
      }

      if (verification.valid) {
        user.code = code;
        user.phoneNumberVerified = true;

        user
          .save()
          .then((updatedUser) => {
            return res.status(200).json({
              message: "OTP verified successfully",
              user: updatedUser,
            });
          })
          .catch((err) => {
            res
              .status(500)
              .json({ error: "Error updating user", details: err });
          });
      }
    })
    .catch((err) => {
      res.status(500).json({ error: "Server error", details: err });
    });
};
exports.checkUsernameExists = async (req, res) => {
  const { username } = req.body;

  try {
    const user = await User.findOne({ username });

    if (user) {
      return res.status(400).json({ exists: true, message: "Username already exists" });
    } else {
      return res.status(200).json({ exists: false, message: "Username available" });
    }
  } catch (err) {
    return res.status(500).json({ error: "Server error", details: err });
  }
};
