const { Schema, model } = require("mongoose");

const { handleValidateError, runUpdateValidators } = require("./hooks");

const electricSchema = new Schema(
  {
    propId: {
      type: String,
      required: [true, "Set prop ID"],
    },
    plan: {
      type: String,
      required: [true, "Set plan (standart or pro)."],
    },
    electricTariff: {
      type: Number,
      required: [true, "Set tariff"],
    },
    updateAt: {
      type: String,
    },
    standart: {
      type: [
        {
          current: Number,
          previous: Number,
          forPay: Number,
          paid: Number,
          debt: Number,
        },
      ],
    },
    pro: {
      type: [
        {
          current: { day: Number, night: Number },
          previous: { day: Number, night: Number },
          forPay: Number,
          paid: Number,
          debt: Number,
        },
      ],
    },
  },
  { versionKey: false }
);

electricSchema.pre("findOneAndUpdate", runUpdateValidators);

electricSchema.post("findOneAndUpdate", handleValidateError);

electricSchema.post("save", handleValidateError);

const Electric = model("electric", electricSchema);

module.exports = Electric;
