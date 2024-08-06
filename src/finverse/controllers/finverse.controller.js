const { getUserIdFromReq } = require("../../utils/utils");
const Finverse = require("../models/finverse");
const mongoose = require("mongoose");
const validatePaymentUserInput = require("../validator/finverseUser");
const {
  getFinverseToken,
  createPaymentUser,
  createPaymentAccount,
  createMandateLink,
  getMandate,
} = require("../../utils/finverse");

exports.createPaymentUser = async (req, res) => {
  const { errors, isValid } = await validatePaymentUserInput(req.body);
  if (!isValid) {
    return res.status(400).json(errors);
  }

  const { name, email } = req.body;

  try {
    const userId = await getUserIdFromReq(req);
    const token = await getFinverseToken();
    const paymentUserData = await createPaymentUser({
      token,
      email,
      name,
      userid: userId,
    });
    const payload = {
      user: userId,
      name: name,
      finverseUserDetails: {
        ...paymentUserData,
        email,
      },
    };

    const paymentUser = new Finverse(payload);
    await paymentUser.save();
    return res.json({
      message: "Payment user created successfully",
      data: paymentUser,
    });
  } catch (error) {
    res.json({
      error: "Error creating payment user",
      details: error,
    });
  }
};

exports.createUserPaymentAccount = async (req, res) => {
  const { account_number, institution_id, accType } = req.body;

  try {
    const userId = await getUserIdFromReq(req);
    const finversUser = await Finverse.findOne({ user: userId });
    const token = await getFinverseToken();
    const userAccountData = await createPaymentAccount({
      token,
      account_number,
      name: finversUser.name,
      institution_id,
      user_id: finversUser.finverseUserDetails.user_id,
      accType,
    });
    const payload = {
      finverseUserAccountDetails: userAccountData,
    };
    const updatedfinverseUser = await Finverse.findOneAndUpdate(
      { user: userId },
      payload,
      { new: true }
    );
    return res.json({
      message: "Payment account created successfully",
      data: updatedfinverseUser,
    });
  } catch (error) {
    res.json({
      error: "Error creating payment user",
      details: error,
    });
  }
};

exports.createMandateLink = async (req, res) => {
  const { currency, redirect_uri } = req.body;

  try {
    const userId = await getUserIdFromReq(req);
    const finversUser = await Finverse.findOne({
      user: mongoose.Types.ObjectId(userId),
    });
    const token = await getFinverseToken();

    const {
      name,
      finverseUserDetails: { external_user_id, email },
    } = finversUser;
    const sender = {
      name,
      email,
      external_user_id,
    };
    const mandateLinkData = await createMandateLink({
      token,
      currency,
      redirect_uri,
      sender,
      unique_reference_id: userId,
    });
    const updatedfinverseUser = await Finverse.findOneAndUpdate(
      { user: userId },
      {
        payment_link_id: mandateLinkData.payment_link_id,
        url: mandateLinkData.url,
      },
      { new: true }
    );
    return res.json({
      message: "Mandate link created successfully",
      data: updatedfinverseUser,
    });
  } catch (error) {
    res.json({
      error: "Error creating mandate link",
      details: error,
    });
  }
};

exports.getMendateInfo = async (req, res) => {
  try {
    const userId = await getUserIdFromReq(req);
    const finversUser = await Finverse.findOne({
      user: mongoose.Types.ObjectId(userId),
    });
    const token = await getFinverseToken();
    const mandateInfo = await getMandate({
      token,
      payment_link_id: finversUser.payment_link_id,
    });
    const updatedfinverseUser = await Finverse.findOneAndUpdate(
      { user: userId },
      {
        finversePaymentLinkDetails: mandateInfo,
      },
      { new : true }
    );
    return res.json({
      message: "Mandate info fetched successfully",
      data: updatedfinverseUser,
    });
  } catch (error) {
    res.json({
      error: "Error fetching mandate info",
      details: error,
    });
  }
}
