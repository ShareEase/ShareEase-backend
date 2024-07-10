const axios = require("axios");
const mongoose = require("mongoose");
const User = mongoose.model("User");
const { getUserIdFromReq, getFinverseToken } = require("../../utils/utils");
const PaymentUser = require("../models/finverse");

const validatePaymentUserInput = require("../validator/finverseUser");

exports.createPaymentUser = async (req, res) => {
  const { errors, isValid } = validatePaymentUserInput(req.body);

  if (!isValid) {
    return res.status(400).json(errors);
  }

  const {
    name,
    email,
    externalUserId,
  } = req.body;

  try {
    const userId = await getUserIdFromReq(req);
    const token = await getFinverseToken();
    console.log(token);
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const response = await axios.post(
      `${process.env.FINVERSE_API_HOST}/payment_users/`,
      {
        external_user_id: externalUserId,
        name: name,
        user_type: "INDIVIDUAL",
        email: email,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    console.log(response);
    const paymentUser = new PaymentUser({
        user: userId,
        finverseUserId: response.data.id,
        email: response.data.email,
        externalUserId: response.data.external_user_id,
        metadata: response.data.metadata,
        name: response.data.name,
        userDetails: response.data.user_details,
        userType: response.data.user_type,
      });
  
      await paymentUser.save();
  
      res.status(201).json({
        success: true,
        paymentUser,
      });
  } catch (error) {
    res.json({
      error: "Error creating payment user",
      details: error.response ? error.response.data : error.message,
    });
  }
};
