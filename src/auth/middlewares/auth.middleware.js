const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
var User = mongoose.model("User");
exports.verifyRefreshBodyField = (req, res, next) => {
  if (req.body && req.body.refresh_token) {
    next();
  } else {
    return res.status(403).send({ error: "Need to pass a refresh token" });
  }
};

exports.validRefreshNeeded = (req, res, next) => {
  var refresh_token = req.body.refresh_token;
  bcrypt.compare(
    req.jwt.id + process.env.JWT_SECRET,
    refresh_token,
    function (err, comp) {
      if (err || !comp) {
        res.status(403).send({ error: "Invalid refresh token" });
      } else {
        req.body = req.jwt;
        next();
      }
    }
  );
};

exports.JwtNeeded = (req, res, next) => {
  if (req.headers["authorization"]) {
    try {
      let authorization = req.headers["authorization"].split(" ");
      if (authorization[0] !== "Bearer") {
        return res
          .status(403)
          .send({ error: "Need to pass a token with 'Bearer'" });
      } else {
        req.jwt = jwt.decode(authorization[1]);
        return next();
      }
    } catch (err) {
      return res.status(403).send({ error: "Invalid token" });
    }
  } else {
    return res.status(403).send({ error: "Need to pass a token" });
  }
};

exports.validJWTNeeded = async (req, res, next) => {
  if (req.headers["authorization"]) {
    try {
      let authorization = req.headers["authorization"].split(" ");
      if (authorization[0] !== "Bearer") {
        return res.status(403).send({ error: "Need to pass a valid token" });
      } else {
        req.jwt = jwt.verify(authorization[1], process.env.JWT_SECRET);
        const user = await User.findById(req.jwt.id);
        if (!user) {
          return res.status(404).send({ error: "User not found" });
        }
        if (!user.phoneNumber || !user.code) {
          return res
            .status(400)
            .send({ error: "Please verify your Phone Number and try again" });
        }

        return next();
      }
    } catch (err) {
      return res.status(403).send({ error: "Need to pass a valid token" });
    }
  } else {
    return res.status(403).send({ error: "Need to pass a valid token" });
  }
};
