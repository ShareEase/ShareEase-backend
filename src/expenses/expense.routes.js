const express = require("express");
const router = express.Router();

const AuthMiddleware = require("../auth/middlewares/auth.middleware");
const ExpenseController = require("./controllers/expense.controller");

router.post("/create", [
  AuthMiddleware.validJWTNeeded,
  ExpenseController.createExpense,
]);

router.get("/:expenseId", [
  AuthMiddleware.validJWTNeeded,
  ExpenseController.getExpense,
]);

module.exports = router;
