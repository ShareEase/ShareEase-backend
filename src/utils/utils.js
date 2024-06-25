const AWS = require("aws-sdk");
const uuid = require("uuid").v4;
const { UniClient } = require("uni-sdk");
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioClient = require("twilio")(accountSid, authToken);

AWS.config.update({
  accessKeyId: process.env.S3_ACCESS_KEY,
  secretAccessKey: process.env.S3_SECRET_ACCESS,
  region: process.env.S3_REGION,
});

const s3 = new AWS.S3();

const client = new UniClient({
  accessKeyId: process.env.UNIMTX_API_KEY,
});

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

exports.sendInviteMessage = async (phoneNumber) => {
  try {
    const data = await twilioClient.messages.create({
      body: "what is this",
      from: "+12518626177",
      to: "+923432732771",
    });
    return data;
  } catch (error) {
    return error;
  }
};
