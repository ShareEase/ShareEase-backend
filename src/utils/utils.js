const AWS = require("aws-sdk");
const uuid = require("uuid").v4;
const { UniClient } = require("uni-sdk");
const twilio = require("twilio");
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceSid = process.env.TWILIO_SERVICE_SID;
const twilioClient = twilio(accountSid, authToken);
const axios = require("axios");

let finverseToken = null;
AWS.config.update({
  accessKeyId: process.env.S3_ACCESS_KEY,
  secretAccessKey: process.env.S3_SECRET_ACCESS,
  region: process.env.S3_REGION,
});

const s3 = new AWS.S3();
exports.uploadImage = (file, callback) => {
  const fileExtension = file.originalname.split(".").pop();
  const fileName = `${uuid()}.${fileExtension}`;

  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: fileName,
    Body: file.buffer,
    ACL: "public-read",
    ContentType: file.mimetype,
  };

  s3.upload(params, (err, data) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, data.Location);
    }
  });
};

exports.sendOTP = async (phoneNumber) => {
  try {
    const verification = await twilioClient.verify.v2
      .services(serviceSid)
      .verifications.create({ to: phoneNumber, channel: "sms" });
    console.log(verification.status);
    return verification;
  } catch (error) {
    console.error(error);
    throw new Error("Error sending OTP");
  }
};

exports.verifyOTP = async (phoneNumber, code) => {
  try {
    const verificationCheck = await twilioClient.verify.v2
      .services(serviceSid)
      .verificationChecks.create({ to: phoneNumber, code });
    return verificationCheck;
  } catch (error) {
    console.error(error);
    throw new Error("Error verifying OTP");
  }
};
exports.getUserIdFromReq = (req) => {
  return req.jwt.id;
};

exports.getFinverseToken = async () => {
  if (finverseToken) {
    return finverseToken;
  }

  const data = {
    client_id: process.env.FINVERSE_CLIENT_ID,
    client_secret: process.env.FINVERSE_CLIENT_SECRET,
    grant_type: "client_credentials",
  };
  const config = {
    method: "post",
    maxBodyLength: Infinity,
    url: `${process.env.FINVERSE_API_HOST}/auth/customer/token`,
    headers: {
      "X-Request-Id": uuid(),
      "Content-Type": "application/json",
    },
    data: data,
  };

  try {
    const response = await axios(config);
    finverseToken = response.data.access_token;
    return finverseToken;
  } catch (error) {
    console.log(error, "error");
    return error;
  }
};
