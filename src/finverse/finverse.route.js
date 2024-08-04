const express = require('express');
const router = express.Router();
const AuthMiddleware = require('../auth/middlewares/auth.middleware');
const PaymentUserController = require('./controllers/finverse.controller');

router.post('/createFinverseUser', [
  AuthMiddleware.validJWTNeeded,
  PaymentUserController.createPaymentUser,
]);

router.post('/createUserPaymentAccount', [
  AuthMiddleware.validJWTNeeded,
  PaymentUserController.createUserPaymentAccount,
]);
router.post('/createMendateLink', [
  AuthMiddleware.validJWTNeeded,
  PaymentUserController.createMandateLink,
]);

router.get('/getMandate', [
  AuthMiddleware.validJWTNeeded,
  PaymentUserController.getMendateInfo,
]);




module.exports = router;
