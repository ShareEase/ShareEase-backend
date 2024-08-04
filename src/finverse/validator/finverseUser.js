const Validator = require("validator");
const isEmpty = require("is-empty");
var mongoose = require("mongoose");
var User = mongoose.model("User");

module.exports = async function validatePaymentUserInput(data) {
  let errors = {};
  data.name = !isEmpty(data.name) ? data.name : "";
  data.email = !isEmpty(data.email) ? data.email : "";

  if (Validator.isEmpty(data.name)) {
    errors.name = "Name field is required";
  }

  if (Validator.isEmpty(data.email)) {
    errors.email = "Email field is required";
  } else if (!Validator.isEmail(data.email)) {
    errors.email = "Email is invalid";
  }

  if (!Validator.isLength(data.name, { min: 2, max: 30 })) {
    errors.name = "Name must be between 2 and 30 characters";
  }

  const existingUser = await User.findOne({ email: data.email });
  if (existingUser === null) {
    errors.email = "Email does not exist";
  }

  return {
    errors,
    isValid: isEmpty(errors),
  };
};
