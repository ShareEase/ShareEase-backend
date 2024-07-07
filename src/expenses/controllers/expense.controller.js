const Expense = require("../models/expense");
const Group = require("../../groups/models/group");
const mongoose = require("mongoose");
var User = mongoose.model("User");
const multer = require("multer");
const Notification = require("../../notification/model/notification");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage }).single("expenseImageFile");

exports.createExpense = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(500).json({ error: "Error uploading file" });
    }

    const {
      description,
      amount,
      paid_by,
      splittingType,
      dateOfExpense,
      groupId,
      notes,
      splitDetails,
      expenseImageFile,
    } = req.body;

    const createNotifications = async (
      expenseId,
      group,
      payer,
      splitDetails
    ) => {
      const notifications = splitDetails.map((detail) => ({
        userId: detail.user,
        groupId: group._id,
        expenseId,
        creator: payer._id,
        alertType: "addedExpense",
        message: `A new expense "${description}" was created in the group "${group.name}"`,
        type: "alert",
      }));

      await Notification.insertMany(notifications);
    };

    const createExpenseRecord = async (imageUrl = null) => {
      try {
        const group = await Group.findById(groupId);
        if (!group) {
          return res.status(404).json({ error: "Group not found" });
        }

        const payer = await User.findById(paid_by);
        if (!payer) {
          return res.status(404).json({ error: "Payer not found" });
        }

        let calculatedSplitDetails;

        switch (splittingType) {
          case "equal":
            const selectedMembers = splitDetails.filter(
              (detail) => detail.selected
            );
            if (selectedMembers.length === 0) {
              return res
                .status(400)
                .json({ error: "No members selected for splitting" });
            }
            const splitAmount = amount / selectedMembers.length;
            calculatedSplitDetails = selectedMembers.map((detail) => ({
              user: detail.user,
              amount: Number(splitAmount.toFixed(2)),
            }));
            break;

          case "amount":
            const amountDetails = splitDetails;
            if (!amountDetails || !Array.isArray(amountDetails)) {
              return res.status(400).json({
                error: "Split details are required for amount-based splitting",
              });
            }
            const totalSplitAmount = amountDetails.reduce(
              (sum, split) => sum + (Number(split.amount) || 0),
              0
            );
            if (Math.abs(totalSplitAmount - amount) > 0.01) {
              return res.status(400).json({
                error: "Total split amount does not match the expense amount",
              });
            }
            calculatedSplitDetails = amountDetails.map((split) => ({
              user: split.user,
              amount: Number((Number(split.amount) || 0).toFixed(2)),
            }));
            break;

          case "percentage":
            const percentageDetails = splitDetails;
            if (!percentageDetails || !Array.isArray(percentageDetails)) {
              return res.status(400).json({
                error:
                  "Split details are required for percentage-based splitting",
              });
            }
            const totalPercentage = percentageDetails.reduce(
              (sum, split) => sum + (Number(split.percentage) || 0),
              0
            );
            if (Math.abs(totalPercentage - 100) > 0.01) {
              return res
                .status(400)
                .json({ error: "Total percentage must equal 100%" });
            }
            calculatedSplitDetails = percentageDetails.map((split) => ({
              user: split.user,
              amount: Number(
                ((Number(split.percentage) / 100) * amount).toFixed(2)
              ),
              percentage: Number(split.percentage),
            }));
            break;

          default:
            return res.status(400).json({ error: "Invalid splitting type" });
        }

        const newExpense = new Expense({
          description,
          amount: Number(amount),
          paid_by,
          splittingType,
          dateOfExpense,
          groupId,
          expenseImageFile: imageUrl,
          notes,
          splitDetails: calculatedSplitDetails,
        });

        await newExpense.save();
        group.expenses.push(newExpense._id);
        await group.save();

        await createNotifications(
          newExpense._id,
          group,
          payer,
          calculatedSplitDetails
        );

        const populatedExpense = await Expense.findById(newExpense._id)
          .populate("paid_by", "name")
          .populate("splitDetails.user", "name")
          .populate("groupId", "name");

        res.status(201).json({
          success: true,
          message: "Expense created successfully and added to the group",
          expense: populatedExpense,
        });
      } catch (error) {
        res.status(500).json({
          error: "Error processing request",
          details: error.message,
          stack: error.stack,
        });
      }
    };

    if (expenseImageFile && expenseImageFile.data) {
      const buffer = Buffer.from(expenseImageFile.data, "base64");
      const tempFile = {
        buffer: buffer,
        originalname: expenseImageFile.name,
        mimetype: expenseImageFile.type,
      };
      uploadImage(tempFile, (err, url) => {
        if (err)
          return res.status(500).json({ error: "Image upload failed", err });
        createExpenseRecord(url);
      });
    } else {
      createExpenseRecord();
    }
  });
};

exports.getExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.expenseId)
      .populate("paid_by", "name")
      .populate("splitDetails.user", "name")
      .populate("groupId", "name");

    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }

    res.status(200).json({
      success: true,
      expense,
    });
  } catch (err) {
    res.status(500).json({
      error: "Error processing request",
      details: err.message,
    });
  }
};
