const JwtStrategy = require("passport-jwt").Strategy;

var GoogleStrategy = require("passport-google-oauth").OAuth2Strategy;
var FacebookStrategy = require("passport-facebook").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;

const opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = process.env.JWT_SECRET;
const User = require("../users/models/User");
const UsersController = require("../users/controllers/users.controller");

module.exports = passport => {
  passport.serializeUser(function(user, done) {
    done(null, user);
  });

  passport.deserializeUser(function(user, done) {
    done(null, user);
  });
  passport.use(
    new JwtStrategy(opts, (jwt_payload, done) => {
      User.findById(jwt_payload.id)
        .then(user => {
          if (user) {
            return done(null, user);
          }
          return done(null, false);
        })
        .catch(err => console.log(err));
    })
  );
  console.log(process.env.GOOGLE_CLIENT_ID,'dhjadnw');
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/api/auth/google/callback"
      },
      function(token, tokenSecret, profile, done) {
        profile_json = profile._json;
        UsersController.loginOAuth(
          profile_json.email,
          profile_json.given_name,
          profile_json.family_name,
          "google",
          profile.id,
          profile_json.picture,
          function(user) {
            return done(null, user);
          },
          function(err) {
            console.log(err);
            return done(null, false);
          }
        );
      }
    )
  );

  console.log(process.env.FACEBOOK_CLIENT_ID);
  passport.use(
    new FacebookStrategy(
      {
        clientID: process.env.FACEBOOK_CLIENT_ID,
        clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
        callbackURL: "/api/auth/facebook/callback",

        profileFields: ["id", "displayName", "picture.type(large)", "email"]
      },
      function(token, tokenSecret, profile, done) {
        UsersController.loginOAuth(
          profile.emails[0].value,
          profile.displayName.split(" ")[0],
          "",
          "facebook",
          profile.id,
          profile.photos[0].value,
          function(user) {
            return done(null, user);
          },
          function(err) {
            console.log(err);
            return done(null, false);
          }
        );
      }
    )
  );
};
