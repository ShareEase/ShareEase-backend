const axios = require("axios");
const uuid = require("uuid").v4;


let finverseToken = null;

exports.getFinverseToken = async () => {
    if (finverseToken) {
      return finverseToken;
    }
  
    const data = {
      client_id: process.env.FINVERSE_CLIENT_ID,
      client_secret: process.env.FINVERSE_CLIENT_SECRET,
      grant_type: "client_credentials",
    };
    const config = {
      method: "post",
      maxBodyLength: Infinity,
      url: `${process.env.FINVERSE_API_HOST}/auth/customer/token`,
      headers: {
        "X-Request-Id": uuid(),
        "Content-Type": "application/json",
      },
      data: data,
    };
  
    try {
      const response = await axios(config);
      finverseToken = response.data.access_token;
      return finverseToken;
    } catch (error) {
        return error.response.data;
    }
  };


  exports.createPaymentUser = async ({token, email, name, userid}) => {
    if (!token || !email || !name || !userid) {
        throw new Error("Missing required parameters");
    }

    const payload = {
        email: email,
        external_user_id: userid,
        name: name,
        user_type: "INDIVIDUAL"
    };

    const config = {
        method: "post",
        url: `${process.env.FINVERSE_API_HOST}/payment_users/`,
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        data: payload,
    };

    try {
        console.log(payload, 'payload');
        
        const response = await axios(config);
        console.log("response", response);
        
        return response.data;
    } catch (error) {
        return error.response.data;
    }
};

exports.createPaymentAccount = async ({token, account_number, name, institution_id, user_id,accType}) => {
  if (!token || !account_number || !name || !institution_id || !user_id) {
      throw new Error("Missing required parameters");
  }

  const payload = {
      account_number: {
          type: accType? accType.toUpperCase() : "LOCAL",
          number: account_number,
      },
      account_type: "EXTERNAL_ACCOUNT",
      accountholder_name: name,
      currencies: ["HKD", "CNY"],
      institution_id: institution_id,
      user_id: user_id,
  };

  const config = {
      method: "post",
      url: `${process.env.FINVERSE_API_HOST}/payment_accounts/`,
      headers: {
          "X-Request-Id": uuid(),
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
      },
      data: payload,
  };

  try {
      const response = await axios(config);
      return response.data;
  } catch (error) {
    return error.response.data;
  }
};

exports.createMandateLink = async ({token, currency, redirect_uri, sender, unique_reference_id}) => {
  if (!token || !currency || !sender || !unique_reference_id) {
      throw new Error("Missing required parameters");
  }

  const payload = {
      currency: currency,
      link_customizations: {
          language: "en",
          link_mode: "",
          redirect_uri: redirect_uri ? redirect_uri : "",
      },
      mode: "SETUP",
      payment_setup_options: {
          future_payments: "AUTOPAY",
          payment_method_types: ["MANDATE"],
      },
      sender: {
          email: sender.email,
          external_user_id: sender.external_user_id,
          name: sender.name,
      },
      unique_reference_id:  unique_reference_id,
  };

  const config = {
      method: "post",
      url: `${process.env.FINVERSE_API_HOST}/payment_links/`,
      headers: {
          "X-Request-Id": uuid(),
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
      },
      data: payload,
  };

  try {
      const response = await axios(config);
      return response.data;
  } catch (error) {
    return error.response.data;
  }
};

exports.getMandate = async ({token, payment_link_id}) => {
    if (!token || !payment_link_id) {
        throw new Error("Missing required parameters");
    }

    const config = {
        method: "get",
        url: `${process.env.FINVERSE_API_HOST}/payment_links/${payment_link_id}`,
        headers: {
            "X-Request-Id": uuid(),
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
    };

    try {
        const response = await axios(config);
        return response.data;
    } catch (error) {
        return error.response.data;
    }
};



