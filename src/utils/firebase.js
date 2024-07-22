// src/config/firebase.js
const admin = require("firebase-admin");
const serviceAccount = require("../../shareease-aa2df-9f7e539008ad.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;