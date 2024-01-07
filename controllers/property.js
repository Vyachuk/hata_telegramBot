const { ctrlWrapper, checkPayed, sendMsgTelegram } = require("../helpers");
const Property = require("../models/Property");
const { getUserTelegramById } = require("./users");

const getAllPropertyTelegram = async () => {
  const result = await Property.find({ hasElectic: true });
  const editResult = result.map((prop) => ({
    ownerId: prop.ownerId,
    electricData: prop.electricData[0],
  }));
  return editResult;
};

const getPropertyTelegramById = async (id) => {
  const result = await Property.findById(id);
  return result;
};

const addTelegramElecticData = async (_id, electricData) => {
  const result = await Property.findOneAndUpdate(
    { _id },
    { electricData },
    {
      new: true,
    }
  );
  return result;
};

const updateDueArrearsForAll = async (req, res) => {
  const allDataProperty = await Property.find();

  for (const prop of allDataProperty) {
    const debt = prop.dues.reduce((total, next) => {
      if (next.needPay > 0) {
        return total + next.needPay;
      }
      return total;
    }, 0);
    const updatedProp = await Property.findByIdAndUpdate(
      prop._id,
      { dueArrears: debt },
      {
        new: true,
      }
    );
  }

  res.status(200).json("All due arrears is updated.");
};

const updateElectricData = async (req, res) => {
  const { signature, data } = req.body;

  const isVerifedTransaction = checkPayed(data, signature);
  if (!isVerifedTransaction) {
    throw new Error("Not verifed");
  }

  const decodedJSON = Buffer.from(data, "base64").toString("utf-8");
  const { order_id, amount } = JSON.parse(decodedJSON);
  const userId = order_id.split(" ")[0];

  const { electricData, ownerId } = await Property.findById(userId);
  const { forPay, paid } = electricData[0];

  const result = await Property.findByIdAndUpdate(
    userId,
    {
      $set: {
        "electricData.0.paid": paid + amount,
        "electricData.0.debt":
          forPay - (paid + amount) < 0 ? 0 : forPay - (paid + amount),
      },
    },

    {
      new: true,
    }
  );

  if (result) {
    const { telegramChatId } = await getUserTelegramById(ownerId);
    sendMsgTelegram(telegramChatId);
  }

  res.status(200).json({
    message: "Ok",
    status: 200,
    // data: {
    //   isVerifedTransaction,
    //   result,
    // },
  });
};

const getAllProp = async (req, res) => {
  // const result = await Property.find();
  const result = "ok";
  res.status(200).json(result);
};
// const upDateAllUsers = async () => {
//   const result = await Property.find();
//   result.map(async (prop) => {
//     const update = await Property.findOneAndUpdate(
//       { _id: prop._id },
//       { $push: { dues: { year: 2024, count: 1440, needPay: 1440, paid: 0 } } },
//       // {
//       //   dues: [
//       //     { year: 2019, count: 300, needPay: 0, paid: 300 },
//       //     { year: 2020, count: 300, needPay: 0, paid: 300 },
//       //     { year: 2021, count: 300, needPay: 0, paid: 300 },
//       //     { year: 2022, count: 300, needPay: 0, paid: 300 },
//       //     { year: 2023, count: 720, needPay: 0, paid: 720 },
//       //   ],
//       // },
//       {
//         new: true,
//       }
//     );
//   });
// };
// upDateAllUsers();

module.exports = {
  getPropertyTelegramById,
  addTelegramElecticData,
  getAllPropertyTelegram,
  updateDueArrearsForAll: ctrlWrapper(updateDueArrearsForAll),
  getAllProp: ctrlWrapper(getAllProp),
  updateElectricData: ctrlWrapper(updateElectricData),
};
