const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    familyname: {
      type: String,
      required: false,
    },
    email: {
      type: String,
      required: true,
    },
    profilePicture: {
      // link
      type: String,
      required: false,
      default: "",
    },
    password: {
      type: String,
      required: false,
      select: false,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    google: {
      googleId: { type: String, required: false },
    },
    OAuthProvider: {
      type: String,
      required: false,
      default: "",
    },
    token: {
      type: String,
      required: false,
      default: "",
    },
    OAuthId: {
      type: String,
      required: false,
      default: "",
    },
    phoneNumber: {
      type: String,
      required: false,
      default: "",
    },
    code: {
      type: String,
      required: false,
      default: "",
    },
    phoneNumberVerified: {
      type: Boolean,
      required: false,
      default: false,
    },
    refresh_token: {
      type: String,
      required: false,
      default: "",
    },
    fcmTokens: [
      {
        type: String,
        required: false,
        default: [],
      },
    ],
    groups: [
      {
        type: Schema.Types.ObjectId,
        ref: "Group",
        required: false,
      },
    ],

    permissionLevel: Number,
  },
  { timestamps: true, versionKey: false }
);

mongoose.model("User", userSchema);
