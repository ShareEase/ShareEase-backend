// src/config/firebase.js
const admin = require("firebase-admin");
const serviceAccount = require("../../shareease-aa2df-7594658d20a6.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
