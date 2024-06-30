const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const expenseSchema = new Schema(
  {
    description: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    paid_by: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    splittingType: {
      type: String,
      enum: ["equal", "amount", "percentage"],
      required: true,
    },
    splitDetails: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        selected: Boolean,
        amount: Number,
        percentage: Number,
      },
    ],
    dateOfExpense: {
      type: Date,
      required: true,
    },
    groupId: {
      type: Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    expenseImageFile: {
      type: String,
      required: false,
    },
    notes: {
      type: String,
      required: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("Expense", expenseSchema);
