const { ctrlWrapper, HttpError } = require("../helpers");
const userExample = require("../utility/user");
const Users = require("../models/Users");

const getAllUsers = async (req, res) => {
  const result = await Users.find();
  // const result = "ok";
  res.status(200).json(result);
};

const getAllUnregisterUsers = async (req, res) => {
  const result = await Users.find();
  const filterUser = result
    .filter((user) => !user.telegramChatId)
    .map((user) => user.name);
  // const result = "ok";
  res.status(200).json(filterUser);
};

const getAllPin = async (req, res) => {
  const result = await Users.find();
  const updateRes = result.map((item) => {
    const { name, phone, pinCode } = item;
    return { name, phone, pinCode };
  });
  // const updateRes = "ok";
  res.status(200).json(updateRes);
};

const addUser = async (req, res) => {
  const { enterFee, phone, name } = req.body;

  const isUser = await Users.findOne({ $or: [{ phone }, { name }] });
  if (isUser) {
    throw HttpError(409, "This user is already created.");
  }

  const userData = userExample(enterFee);
  const correctData = { ...req.body, ...userData };

  const result = await Users.create(correctData);

  res.status(201).json(result);
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

const addPropIdToUser = async (userId, propId) => {
  const result = await Users.findOneAndUpdate(
    { _id: userId },
    { $push: { owned: propId } },
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
  addUser: ctrlWrapper(addUser),
  getAllUnregisterUsers: ctrlWrapper(getAllUnregisterUsers),
  getUserByChatId,
  getUserTelegramByPhone,
  addTelegramChatIdToUser,
  getUserTelegramById,
  getAllUsersChatId,
  addPropIdToUser,
};
