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
  const { amount, customer } = JSON.parse(decodedJSON);

  const amountWithoutCommision = amount / 1.02;

  const { electricData, ownerId } = await Property.findById(customer);
  const { forPay, paid } = electricData[0];

  const result = await Property.findByIdAndUpdate(
    customer,
    {
      $set: {
        "electricData.0.paid": paid + amountWithoutCommision,
        "electricData.0.debt":
          forPay - (paid + amountWithoutCommision) < 0
            ? 0
            : forPay - (paid + amountWithoutCommision),
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
const updateDuesData = async (req, res) => {
  const { signature, data } = req.body;

  const isVerifedTransaction = checkPayed(data, signature);
  if (!isVerifedTransaction) {
    throw new Error("Not verifed");
  }

  const decodedJSON = Buffer.from(data, "base64").toString("utf-8");
  const { customer, amount, description } = JSON.parse(decodedJSON);

  const amountWithoutCommision = amount / 1.02;

  const { dues, ownerId } = await Property.findById(customer);
  const yearForChange = description
    .split("[")[1]
    .split("]")[0]
    .split(",")
    .map((item) => Number(item.trim()));

  let paidMoney = 0;

  const newDues = dues.map((item, index) => {
    if (yearForChange.includes(item.year)) {
      if (paidMoney < amountWithoutCommision) {
        const remainder = amountWithoutCommision - paidMoney;

        const editItem = {
          ...item._doc,
          paid: remainder < item.needPay ? item.paid + remainder : item.count,
          needPay: remainder < item.needPay ? item.needPay - remainder : 0,
        };

        paidMoney += item.needPay;
        return editItem;
      }
    }
    return item;
  });

  const debt = newDues.reduce((total, next) => {
    if (next.needPay > 0) {
      return total + next.needPay;
    }
    return total;
  }, 0);

  const result = await Property.findByIdAndUpdate(
    customer,
    {
      dues: newDues,
      dueArrears: debt,
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
  updateDuesData: ctrlWrapper(updateDuesData),
};
