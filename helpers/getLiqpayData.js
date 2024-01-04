const crypto = require("crypto");
require("dotenv").config();

const { LIQPAY_PRIVATE_KEY } = process.env;

function getLiqpayData(input) {
  const dataToJSON = JSON.stringify(input);
  const preData = Buffer.from(dataToJSON).toString("base64");
  const data = preData.split("+").join("");

  const sign_string = `${LIQPAY_PRIVATE_KEY}${data}${LIQPAY_PRIVATE_KEY}`;

  const sha1Hash = crypto.createHash("sha1");

  sha1Hash.update(sign_string);

  const binaryHash = sha1Hash.digest(); // Отримання бінарного хешу

  const base64Signature = Buffer.from(binaryHash).toString("base64");

  return { signature: base64Signature, data };
}
module.exports = getLiqpayData;
