const AWS = require("aws-sdk");
const uuid = require("uuid").v4;

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
