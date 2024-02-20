const Joi = require("joi");

const addSchema = Joi.object({
  ownerId: Joi.string().required(),
  propertyNumber: Joi.string().required(),
  area: Joi.string().required(),
  kadastrId: Joi.string().required(),
  ownershipDate: Joi.string().required(),
  electricTariff: Joi.number().optional(),
  hasElectic: Joi.boolean().optional().default(false),
  electricData: Joi.array().optional().default([]),
  dueArrears: Joi.number().optional().default(0),
  duesPaid: Joi.object().required(),
});

module.exports = {
  addSchema,
};
