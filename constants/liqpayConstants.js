require("dotenv").config();

const { LIQPAY_PUBLIC_KEY } = process.env;

const LIQPAY_CONSTANTS = {
  public_key: LIQPAY_PUBLIC_KEY,
  version: "3",
  action: "pay",
  currency: "UAH",
};

module.exports = LIQPAY_CONSTANTS;
