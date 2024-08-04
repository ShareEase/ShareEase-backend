const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const finverseUserDetails = new Schema(
  {
    email: {
      type: String,
      required: false,
    },
    external_user_id: {
      type: String,
      required: true,
    },
    user_id: {
      type: String,
      required: true,
    },
    user_type: {
      type: String,
      required: false,
      default: "INDIVIDUAL",
    },
  },
  { _id: false }
);

const finverseUserAccountNumber = new Schema(
  {
    number: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: false,
      default: "LOCAL",
    },
  },
  { _id: false }
);

const finverseAccountDetails = new Schema(
  {
    finverse_account_id: {
      type: String,
      required: true,
    },
    account_number: {
      type: finverseUserAccountNumber,
      required: true,
    },
    account_type: {
      type: String,
      required: false,
      default: "EXTERNAL_ACCOUNT",
    },
    accountholder_name: {
      type: String,
      required: true,
    },
    currencies: {
      type: [String],
      required: false,
      default: ["HKD"],
    },
    institution_id: {
      type: String,
      required: false,
    },
    account_number_masked: {
      type: String,
      required: false,
    },
  },
  { _id: false }
);

const recipient =new Schema({
  name: {
    type: String,
    required: false,
  },
},
{ _id: false })

const recipient_account = new Schema({
  account_id: {
    type: String, 
    required: false,
  },
  account_type:{
    type: String,
    required: false,
  }

},
{ _id: false })


const mandateInfo = new Schema({
  mandate_id: {
    type: String,
    required: false,
  },
  recipient: {
    type: recipient,
    required: false,
  },
  recipient_account: {
    type: recipient_account,
    required: false,
  },
},
{ _id: false })

const payment_method = new Schema({
  mandate: {
    type: mandateInfo,
    required: false,
  },
  payment_method_id: {
    type: String,
    required: true,
  }
},
{ _id: false });

const finversePaymentLinkDetails = new Schema(
  {
    payment_method: {
      type: payment_method,
      required: true,
    },
    session_status: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const paymentUserSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    finverseUserDetails: {
      type: finverseUserDetails,
      required: false,
    },
    name: {
      type: String,
      required: true,
    },
    finverseUserAccountDetails: {
      type: finverseAccountDetails,
      required: false,
    },
    payment_link_id: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: false,
    },
    finversePaymentLinkDetails: {
      type: finversePaymentLinkDetails,
      required: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Finverse", paymentUserSchema);
