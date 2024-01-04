const axios = require("axios");

const TELEGRAM_API = "https://api.telegram.org/bot";

require("dotenv").config();

const { TELEGRAM_BOT_API } = process.env;

const sendMsgTelegram = async (chatId) => {
  const telegramMessage = `Оплата пройшла успішно. Тепер ви можете повернутись до Головного меню.`;
  const markup = {
    inline_keyboard: [[{ text: "🏪 На головну", callback_data: "mainPage" }]],
    one_time_keyboard: true,
  };

  try {
    const { data } = await axios.post(
      `${TELEGRAM_API}${TELEGRAM_BOT_API}/sendMessage`,
      {
        chat_id: chatId,
        text: telegramMessage,
        reply_markup: markup,
      }
    );
    return data.ok;
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = sendMsgTelegram;
