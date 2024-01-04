const crypto = require("crypto");
require("dotenv").config();

const { LIQPAY_PRIVATE_KEY, LIQPAY_PUBLIC_KEY } = process.env;

const checkPayed = (data, signature) => {
  const sign_string = `${LIQPAY_PRIVATE_KEY}${data
    .split(" ")
    .join("+")}${LIQPAY_PRIVATE_KEY}`;

  const sha1Hash = crypto.createHash("sha1");
  sha1Hash.update(sign_string);
  const binaryHash = sha1Hash.digest(); // Отримання бінарного хешу
  const base64Signature = Buffer.from(binaryHash).toString("base64");

  return signature === base64Signature;
};
module.exports = checkPayed;
