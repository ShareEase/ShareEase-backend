const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const paymentUserSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  finverseUserId: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: false,
  },
  externalUserId: {
    type: String,
    required: true,
  },
  metadata: {
    type: Map,
    of: String,
  },
  name: {
    type: String,
    required: true,
  },
  userDetails: [
    {
      detailsType: String,
      values: [String],
    }
  ],
  userType: {
    type: String,
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

module.exports = mongoose.model('PaymentUser', paymentUserSchema);
