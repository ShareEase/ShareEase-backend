const Validator = require("validator");
const isEmpty = require("is-empty");

module.exports = function validateLoginInput(data) {
  let errors = {};

  if (!data.email || !data.password) {
    errors.auth = "Request invalid";
  }

  data.email = !isEmpty(data.email) ? data.email : "";
  data.password = !isEmpty(data.password) ? data.password : "";

  if (Validator.isEmpty(data.email)) {
    errors.auth = "Email or username field is required";
  }

  if (Validator.isEmpty(data.password)) {
    errors.auth = "Password field is required";
  }

  return {
    errors,
    isValid: isEmpty(errors)
  };
};
