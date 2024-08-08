const AWS = require("aws-sdk");
const uuid = require("uuid").v4;
const twilio = require("twilio");
const mongoose = require("mongoose");
const Expense = require("../expenses/models/expense");
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceSid = process.env.TWILIO_SERVICE_SID;
const twilioClient = twilio(accountSid, authToken);

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
    return verification;
  } catch (error) {
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
    throw new Error("Error verifying OTP");
  }
};
exports.getUserIdFromReq = (req) => {
  return req.jwt.id;
};


exports.calculateBalances = async (groupId, monthOnly = false) => {
  const matchCriteria = { groupId: mongoose.Types.ObjectId(groupId) };
  if (monthOnly) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    matchCriteria.dateOfExpense = { $gte: startOfMonth };
  }

  const expenses = await Expense.aggregate([
    { $match: matchCriteria },
    {
      $unwind: "$splitDetails"
    },
    {
      $group: {
        _id: {
          userId: "$splitDetails.user",
          paidBy: "$paid_by"
        },
        totalPaid: { $sum: { $cond: [{ $eq: ["$paid_by", "$splitDetails.user"] }, "$amount", 0] } },
        totalOwes: { $sum: { $cond: [{ $ne: ["$paid_by", "$splitDetails.user"] }, "$splitDetails.amount", 0] } },
        totalShare: { $sum: "$splitDetails.amount" },
        totalSpent: { $sum: { $cond: [{ $eq: ["$paid_by", "$splitDetails.user"] }, "$amount", 0] } }
      }
    }
  ]);

  const balances = {
    totalGroupSpending: 0,
    userBalances: {}
  };

  expenses.forEach((expense) => {
    const userId = expense._id.userId.toString();
    const paidBy = expense._id.paidBy.toString();

    if (!balances.userBalances[userId]) {
      balances.userBalances[userId] = {
        totalOwes: 0,
        totalOwed: 0,
        totalShare: 0,
        totalPaid: 0,
        totalSpent: 0,
        paymentsMade: 0,
        paymentsReceived: 0
      };
    }

    balances.userBalances[userId].totalShare += expense.totalShare;

    if (userId === paidBy) {
      balances.userBalances[userId].totalPaid += expense.totalPaid;
      balances.userBalances[userId].totalSpent += expense.totalSpent;
      balances.totalGroupSpending += expense.totalSpent;
    } else {
      balances.userBalances[userId].totalOwes += expense.totalOwes;
      if (!balances.userBalances[paidBy]) {
        balances.userBalances[paidBy] = {
          totalOwes: 0,
          totalOwed: 0,
          totalShare: 0,
          totalPaid: 0,
          totalSpent: 0,
          paymentsMade: 0,
          paymentsReceived: 0
        };
      }
      balances.userBalances[paidBy].paymentsReceived += expense.totalOwes;
      balances.userBalances[userId].paymentsMade += expense.totalOwes;
    }
  });
  
  return balances;
};

