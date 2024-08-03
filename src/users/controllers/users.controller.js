const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
var User = mongoose.model("User");

exports.insert = (req, res) => {
  User.findOne({ email: req.body.email }).then((user) => {
    if (user) {
      return res.status(400).json({ email: "Email already exists" });
    } else {
      const newUser = {
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
      };

      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(newUser.password, salt, (err, hash) => {
          if (err) throw err;
          newUser.password = hash;
          User.create(newUser)
            .then((user) => {
              let userobject = user.toObject();

              delete userobject.password;
              res.json(userobject);
            })
            .catch(function (error) {
              throw err;
            });
        });
      });
    }
  });
};

exports.loginOAuth = (
  email,
  name,
  familyName,
  provider,
  id_provider,
  picture = "",
  cb_success,
  cb_fail
) => {
  User.findOne(
    { OAuthId: id_provider, OAuthProvider: provider, email: email },
    (err, userMatch) => {
      if (err) {
        return cb_fail(err);
      }
      if (userMatch) {
        cb_success(userMatch);
      } else {
        const newUser0Auth = {
          OAuthProvider: provider,
          OAuthId: id_provider,
          name: name,
          familyname: familyName,
          profilePicture: picture,
          email: email,
          permissionLevel: 0,
        };
        User.create(newUser0Auth)
          .then((user) => {
            cb_success(user);
          })
          .catch(function (error) {
            cb_fail(error);
          });
      }
    }
  );
};

exports.list = (req, res) => {
  let limit =
    req.query.limit && req.query.limit <= 100 ? parseInt(req.query.limit) : 10;
  let page = 0;
  if (req.query) {
    if (req.query.page) {
      req.query.page = parseInt(req.query.page);
      page = Number.isInteger(req.query.page) ? req.query.page : 0;
    }
  }
  User.list(limit, page).then((result) => {
    res.status(200).send(result);
  });
};

exports.getById = (req, res) => {
  User.findById(req.params.userId)
    .then((result) => {
      return res.status(200).send(result);
    })
    .catch((err) => {
      return res
        .status(400)
        .send({ error: "Error. Probably Wrong id.", err: err });
    });
};

exports.patchById = (req, res) => {
  delete req.body["permissionLevel"];
  delete req.body["id"];
  var newUser = req.body;
  if (req.body.password) {
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(newUser.password, salt, (err, hash) => {
        if (err) throw err;
        newUser.password = hash;

        User.patch(req.params.userId, newUser).then((result) => {
          res.status(200).send({
            success: true,
            message: "Password changed",
            result: result,
          });
        });
      });
    });
  } else {
    User.patch(req.params.userId, req.body).then((result) => {
      res.status(200).send({
        success: true,
        message: "User updated",
        result: result,
      });
    });
  }
};
exports.removeById = (req, res) => {
  User.removeById(req.params.userId).then((result) => {
    res.status(200).send({});
  });
};

exports.addFcmToken = (req, res) => {
  const userId = req.params.userId;
  const fcmToken = req.body.fcmToken;
  if (!fcmToken || !userId) {
    return res
      .status(400)
      .json({ message: "Invalid request parameters or body" });
  }
  User.findById(userId).then((user) => {
    if (user) {
      const tokenIndex = user.fcmTokens.findIndex(
        (token) => token === fcmToken
      );
      if (tokenIndex !== -1) {
        user.fcmTokens[tokenIndex] = fcmToken; // Update the existing token
      } else {
        user.fcmTokens.push(fcmToken); // Add the new token
      }
      user.save().then((result) => {
        return res.status(200).json({ message: "Token added", result });
      });
    } else {
      return res.status(400).json({ message: "User not found" });
    }
  });
};
