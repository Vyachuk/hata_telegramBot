const { ctrlWrapper } = require("../helpers");
const Electric = require("../models/Electric");

const { addElectricIdToProp } = require("./property");

const { electricExample } = require("../utility/electric");

const getElectric = async (req, res) => {
  const result = await Electric.find();
  // const result = "ok";
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
  const { propId, plan, electricTariff } = req.body;

  const isElectric = await Electric.findOne({ propId });
  if (isElectric) {
    throw HttpError(409, "This prop is already have electricity.");
  }

  const newElectric = electricExample(propId, plan);

  const result = await Electric.create(newElectric);
  res.status(201).json(result);
};

module.exports = {
  getElectric: ctrlWrapper(getElectric),
  updateElectricIdToAllProp: ctrlWrapper(updateElectricIdToAllProp),
  addElectric: ctrlWrapper(addElectric),
};
