const Joi = require("joi");

const addSchema = Joi.object({
  name: Joi.string().required(),
  phone: Joi.string().required(),
  enterFee: Joi.object({
    isAvailable: Joi.boolean().required(),
    isPaid: Joi.boolean().required(),
  }),
});

module.exports = {
  addSchema,
};
