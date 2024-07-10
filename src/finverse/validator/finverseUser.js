const Validator = require("validator");
const isEmpty = require("is-empty");

module.exports = function validatePaymentUserInput(data) {
  let errors = {};
  data.name = !isEmpty(data.name) ? data.name : "";
  data.externalUserId = !isEmpty(data.externalUserId) ? data.externalUserId : "";

  if (Validator.isEmpty(data.name)) {
    errors.name = "Name field is required";
  }

  if (Validator.isEmpty(data.externalUserId)) {
    errors.externalUserId = "External User ID field is required";
  }

  return {
    errors,
    isValid: isEmpty(errors)
  };
};