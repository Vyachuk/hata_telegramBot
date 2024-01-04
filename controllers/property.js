const { ctrlWrapper, checkPayed } = require("../helpers");
const Property = require("../models/Property");

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

  res.status(200).json("Due Arrears is being apdate");
};

const updateElectricData = async (req, res) => {
  const { data, signature } = req.query;

  const isVerifedTransaction = checkPayed(data, signature);
  // if (!isVerifedTransaction) {
  //   throw new Error("Not verifed");
  // }

  const decodedJSON = Buffer.from(data, "base64").toString("utf-8");
  const { order_id, amount } = JSON.parse(
    decodedJSON.split(',"description"')[0] + "}"
  );

  const { electricData } = await Property.findById(order_id);
  const { forPay, paid } = electricData[0];

  const result = await Property.findByIdAndUpdate(
    order_id,
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

  res.status(200).json({
    message: "Ok",
    status: 200,
    data: {
      isVerifedTransaction,
      result,
    },
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
//       {
//         dues: [
//           { year: 2019, count: 300, paid: 300 },
//           { year: 2020, count: 300, paid: 300 },
//           { year: 2021, count: 300, paid: 300 },
//           { year: 2022, count: 300, paid: 300 },
//           { year: 2023, count: 720, paid: 200 },
//         ],
//       },
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
