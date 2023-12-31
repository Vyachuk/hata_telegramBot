const { ctrlWrapper } = require("../helpers");
const Users = require("../models/Users");

const getAllUsers = async (req, res) => {
  // const result = await Users.find();
  const result = "ok";
  res.status(200).json(result);
};
const getAllPin = async (req, res) => {
  // const result = await Users.find();
  // const updateRes = result.map((item) => {
  //   const { name, phone, pinCode } = item;
  //   return { name, phone, pinCode };
  // });
  const updateRes = "ok";
  res.status(200).json(updateRes);
};

const getUserByChatId = async (telegramChatId) => {
  const user = await Users.findOne({
    telegramChatId,
  });
  return user;
};
const getAllUsersChatId = async () => {
  const usersChatId = await Users.find({}).select("telegramChatId");
  return usersChatId;
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
//         enterFee: { needToPay: 0, count: 0, paid: 0, isAvailable: false },
//       },
//       {
//         new: true,
//       }
//     );
//   });
// };

// upDateAllUsers();

// dues: {
//       type: [{ year: Number, isPaid: Boolean, count: Number }],
//       required: [true, "Set dues for this person!"],
//     },

module.exports = {
  getAllPin: ctrlWrapper(getAllPin),
  getAllUsers: ctrlWrapper(getAllUsers),
  getUserByChatId,
  getUserTelegramByPhone,
  addTelegramChatIdToUser,
  getUserTelegramById,
  getAllUsersChatId,
};
