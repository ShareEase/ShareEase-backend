const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const validateRegisterInput = require("../validation/register");
const validateLoginInput = require("../validation/login");
const passport = require("passport");
const mongoose = require("mongoose");
var User = mongoose.model("User");
const UsersController = require("../../users/controllers/users.controller");
require("dotenv").config();
const { UniClient } = require("uni-sdk");

const client = new UniClient({
  accessKeyId: process.env.UNIMTX_API_KEY,
});

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

exports.registerUser = (req, res) => {
  const { errors, isValid } = validateRegisterInput(req.body);

  if (!isValid) {
    return res.status(400).json(errors);
  }

  return UsersController.insert(req, res);
};

exports.loginUser = (req, res) => {
  const { errors, isValid } = validateLoginInput(req.body);

  if (!isValid) {
    return res.status(400).json(errors);
  }

  const email = req.body.email;
  const password = req.body.password;

  User.findOne({ email })
    .select("+password")
    .then((user) => {
      if (!user) {
        return res.status(404).json({ auth: "Email not found" });
      }
      bcrypt.compare(password, user.password).then((isMatch) => {
        if (isMatch) {
          const payload = {
            id: user.id,
            name: user.name,
            email: user.email,
            profilePicture: user.profilePicture,
            permissionLevel: user.permissionLevel,
            phoneNumberVerified: user.phoneNumberVerified,
          };
          this.generateTokens(payload)
            .then(([token]) => {
              User.findByIdAndUpdate(user.id, { token: token }, { new: true })
                .then(updatedUser => {
                  res.status(200).json({
                    success: true,
                    message: "User logged in successfully",
                    token: "Bearer " + token,
                    user: updatedUser,
                  });
                })
                .catch((err) => {
                  return res.status(500).json({ error: "Error saving token", err: err });
                });
            })
            .catch((err) => {
              return res.status(400).send({ error: "Error", err: err });
            });
        } else {
          return res.status(400).send({ error: "Password incorrect" });
        }
      });
    });
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

exports.loginGoogleStore = async (req, res, next) => {
  const { token, user } = req.body;
  if (!token || !user) {
    return res.status(400).send({ error: "Token and user data are required" });
  }
  const { id, name, email, profilePicture, permissionLevel } = user;
  try {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      existingUser.token = token;
      existingUser.OAuthId = id;
      await existingUser.save().then((user) => {
        return res
          .status(200)
          .send({ message: "User logged in successfully", user });
      });
    } else {
      const newUser = new User({
        name,
        email,
        profilePicture,
        permissionLevel,
        token,
        OAuthId: id,
      });
      await newUser.save().then((user) => {
        return res
          .status(200)
          .send({ message: "User logged in successfully", user });
      });
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
        client.otp
          .send({
            to: phoneNumber,
            channel: "whatsapp",
          })
          .then((ret) => {
            return res
              .status(200)
              .json({ message: "OTP sent successfully", ret });
          });
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
    .then((user) => {
      if (!user) {
        return res.status(404).json({ auth: "User not found" });
      }

      user.code = code;
      user.phoneNumberVerified = true;
      user.save().then(async (updatedUser) => {
        client.otp
          .verify({
            to: phoneNumber,
            code: code,
          })
          .then((ret) => {
            if (!ret.valid) {
              return res.status(400).json({ message: "Invalid OTP" });
            }
            return res
              .status(200)
              .json({ message: "OTP verified successfully", ret });
          });
      });
    })
    .catch((err) => {
      res.status(500).json({ error: "Server error", details: err });
    });
};
