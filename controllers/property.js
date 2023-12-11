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

module.exports = {
  getPropertyTelegramById,
  addTelegramElecticData,
  getAllPropertyTelegram,
};
