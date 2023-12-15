const { Schema, model } = require("mongoose");

const { handleValidateError, runUpdateValidators } = require("./hooks");

const usersSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Set user name"],
    },
    phone: {
      type: String,
      required: [true, "Set user mobile phone"],
    },
    owned: {
      type: [String],
      required: [true, "Incorrect owned Id"],
    },
    enterFee: {
      type: {
        isAvailable: Boolean,
        paid: Number,
        count: Number,
        needToPay: Number,
      },
    },
    telegramChatId: {
      type: String,
    },
    admin: {
      type: Boolean,
    },
    pinCode: {
      type: String,
      required: [true, "Add PIN Code"],
      default: (Math.random() * 100).toString().slice(0, 4),
    },
  },
  { versionKey: false }
);

usersSchema.pre("findOneAndUpdate", runUpdateValidators);

usersSchema.post("findOneAndUpdate", handleValidateError);

usersSchema.post("save", handleValidateError);

const Users = model("user", usersSchema);

module.exports = Users;
