const express = require('express');
const router = express.Router();
const AuthMiddleware = require('../auth/middlewares/auth.middleware');
const PaymentUserController = require('./controllers/finverse.controller');

router.post('/login', [
  AuthMiddleware.validJWTNeeded,
  PaymentUserController.createPaymentUser,
]);

module.exports = router;
