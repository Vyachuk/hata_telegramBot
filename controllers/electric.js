const {
  ctrlWrapper,
  formatDate,
  sendMsgTelegram,
  checkPayed,
  HttpError,
} = require("../helpers");
const Electric = require("../models/Electric");
const { electricExample } = require("../utility");

const { addElectricIdToProp, getPropertyBy } = require("./property");

const getElectric = async (req, res) => {
  const result = await getAllElectricData();
  res.status(200).json(result);
};

const updateElectricIdToAllProp = async (req, res) => {
  const result = await Electric.find();

  result.map(async (elect) => {
    addElectricIdToProp(elect.propId, elect._id);
  });
  res
    .status(200)
    .json({ message: "All prop are updated with correct Electric Id." });
};

const addElectric = async (req, res) => {
  const { propertyNumber, plan } = req.body;

  const prop = await getPropertyBy({ propertyNumber });
  if (prop.isElectic) {
    throw HttpError(409, "This prop is already have electricity.");
  }
  const newElectric = electricExample(prop._id, plan);

  const result = await Electric.create(newElectric);
  await addElectricIdToProp(result.propId, result._id);

  res.status(201).json(result);
};

const updateElectricIndicatorFromLiqpay = async (req, res) => {
  const { signature, data } = req.body;

  const isVerifedTransaction = checkPayed(data, signature);
  if (!isVerifedTransaction) {
    throw new Error("Not verifed");
  }

  const decodedJSON = Buffer.from(data, "base64").toString("utf-8");
  const { amount, customer } = JSON.parse(decodedJSON);

  const amountWithoutCommision = amount / 1.02;

  const elec = await getElectricBy({ _id: customer });
  const { forPay, paid } = elec[elec.plan][0];

  const updateObj = {};
  updateObj[`${elec.elec[plan]}.0.paid`] = paid + amountWithoutCommision;
  updateObj[`${elec.elec[plan]}.0.debt`] =
    forPay - (paid + amountWithoutCommision) < 0
      ? 0
      : forPay - (paid + amountWithoutCommision);

  const result = await Electric.findByIdAndUpdate(
    customer,
    { $set: updateObj },
    { new: true }
  );

  if (result) {
    const { ownerId } = await getPropertyBy({ _id: elec.propId });
    const { telegramChatId } = await getUserTelegramById(ownerId);
    sendMsgTelegram(
      telegramChatId,
      `Оплата пройшла успішно. Тепер ви можете повернутись до Головного меню.`
    );
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

const getAllElectricData = async () => {
  const result = await Electric.find();
  return result;
};

const getElectricBy = async (data) => {
  try {
    const result = await Electric.findOne(data);
    return result;
  } catch (error) {}
};

const addIndicator = async (elec, indicator) => {
  const electricData = elec[elec.plan][0];
  const isAnyIndicators = elec[elec.plan].length;
  let data;

  if (elec.plan === "pro") {
    const [dayStr, nightStr] = indicator.split(/ +/);
    const day = Number(dayStr);
    const night = Number(nightStr);

    if (isAnyIndicators) {
      if (
        day < electricData.current.day ||
        isNaN(day) ||
        night < electricData.current.night ||
        isNaN(night)
      ) {
        return {
          error: `Показник повинен бути більшим за минулий. Впишіть коректний показник. (день ніч) Приклад: ${electricData.current.day} ${electricData.current.night}`,
        };
      }
    }

    const forPay =
      (day - electricData.current.day) * elec.electricTariff +
      (night - electricData.current.night) * (elec.electricTariff / 2) +
      (electricData?.debt || 0);

    data = await updateElectricIndicators(elec._id, elec.plan, [
      {
        current: { day, night },
        previous: isAnyIndicators ? electricData.current : { day: 0, night: 0 },
        forPay,
        paid: 0,
        debt: forPay,
      },
      ...elec[elec.plan],
    ]);
  }

  if (elec.plan === "standart") {
    const newIndicator = Number(indicator);

    if (isAnyIndicators) {
      if (newIndicator < electricData.current) {
        return {
          error:
            "Показник повинен бути більшим за минулий. Впишіть коректний показник.",
        };
      }
    }

    const forPay =
      (newIndicator - (electricData?.current || 0)) * elec.electricTariff +
      (electricData?.debt || 0);

    data = await updateElectricIndicators(elec._id, elec.plan, [
      {
        current: newIndicator,
        previous: isAnyIndicators ? electricData.current : 0,
        forPay,
        paid: 0,
        debt: forPay,
      },
      ...elec[elec.plan],
    ]);
  }

  return { data };
};

const updateElectricIndicators = async (_id, plan, electricData) => {
  const { fullDate } = formatDate();
  const result = await Electric.findOneAndUpdate(
    { _id },
    {
      [plan]: electricData,
      updateAt: fullDate,
    },
    {
      new: true,
    }
  );
  return result;
};

module.exports = {
  getElectric: ctrlWrapper(getElectric),
  updateElectricIdToAllProp: ctrlWrapper(updateElectricIdToAllProp),
  addElectric: ctrlWrapper(addElectric),
  updateElectricIndicatorFromLiqpay: ctrlWrapper(
    updateElectricIndicatorFromLiqpay
  ),
  getAllElectricData,
  getElectricBy,
  addIndicator,
};

// const upDateAllUsers = async () => {
//   // const updateAt = new Date().toISOString().slice(0, 10);

//   const result = await Electric.find();
//   const filRes = result.filter((item) => item.updateAt === "2024-02-24");
//   filRes.map(async (prop) => {
//     const update = await Electric.findOneAndUpdate(
//       { _id: prop._id },
//       // { $push: { dues: { year: 2024, count: 1440, needPay: 1440, paid: 0 } } },

//       {
//         updateAt: "2024-02-01",
//       },
//       {
//         new: true,
//       }
//     );
//   });
// };
// upDateAllUsers();
