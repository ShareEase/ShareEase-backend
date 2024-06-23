const AWS = require("aws-sdk");
const uuid = require("uuid").v4;
const { UniClient } = require("uni-sdk");

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
    client.messages
      .send({
        to: phoneNumber,
        templateId: "pub_otp_en_basic",
      })
      .then((response) => {
        return response;
      })
      .catch((error) => {
        console.error(error);
      });
  } catch (error) {
    throw new Error(error.message);
  }
};
