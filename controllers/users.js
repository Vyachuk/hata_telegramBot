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

const getUserTelegramByPhone = async (phone) => {
  const result = await Users.findOne({ phone });
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

// const upDateAllUsers = async () => {
//   const result = await Users.find();

//   result.map(async (user) => {
//     const update = await Users.findOneAndUpdate(
//       { phone: user.phone },
//       {
//         dues: [
//           { year: 2019, isPaid: false, count: 300 },
//           { year: 2020, isPaid: false, count: 300 },
//           { year: 2021, isPaid: false, count: 300 },
//           { year: 2022, isPaid: false, count: 300 },
//           { year: 2023, isPaid: false, count: 720 },
//         ],
//       },
//       {
//         new: true,
//       }
//     );
//   });
// };
// // upDateAllUsers();

// dues: {
//       type: [{ year: Number, isPaid: Boolean, count: Number }],
//       required: [true, "Set dues for this person!"],
//     },

module.exports = {
  getUserByChatId,
  getUserTelegramByPhone,
  addTelegramChatIdToUser,
  getUserTelegramById,
};
