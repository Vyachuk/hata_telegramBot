const Users = require("../models/Users");

const getUserByChatId = async (telegramChatId) => {
  const user = await Users.findOne({
    telegramChatId,
  });
  return user;
};
const getUserTelegramById = async (id) => {
  const result = await Users.findById(id);
  return result;
};

const addTelegramChatIdToUser = async (phone, telegramChatId) => {
  const result = await Users.findOneAndUpdate(
    { phone },
    { telegramChatId },
    {
      new: true,
    }
  );
  return result;
};

module.exports = {
  getUserByChatId,
  addTelegramChatIdToUser,
  getUserTelegramById,
};
