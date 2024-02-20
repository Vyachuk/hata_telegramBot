const Joi = require("joi");

const addSchema = Joi.object({
  propId: Joi.string().required(),
  plan: Joi.string(),
  electricTariff: Joi.number().optional(),
});

module.exports = {
  addSchema,
};
