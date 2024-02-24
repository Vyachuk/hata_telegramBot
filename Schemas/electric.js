const Joi = require("joi");

const addSchema = Joi.object({
  propertyNumber: Joi.string().required(),
  plan: Joi.string(),
});

module.exports = {
  addSchema,
};
