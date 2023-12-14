const { Schema, model } = require("mongoose");

const { handleValidateError, runUpdateValidators } = require("./hooks");

const propertySchema = new Schema(
  {
    ownerId: {
      type: String,
      required: [true, "Set owner ID"],
    },
    propertyNumber: {
      type: String,
      required: [true, "Set property number"],
    },
    area: {
      type: String,
      required: [true, "Set area count. Example: 8.73"],
    },
    kadastrId: {
      type: String,
      required: [true, "Set kadastr Id"],
    },
    ownershipDate: {
      type: String,
      required: [true, "Set date, when property was buying"],
    },
    dues: {
      type: [{ year: Number, needPay: Number, count: Number, paid: Number }],
    },
    dueArrears: {
      type: Number,
    },
    hasElectic: {
      type: Boolean,
      required: [true, "Set true/false"],
    },
    electricTariff: {
      type: Number,
      required: [true, "Set tariff"],
    },
    electricData: {
      type: [
        { date: String, current: Number, previous: Number, forPay: Number },
      ],
      required: [true, "Set current data"],
    },
  },
  { versionKey: false }
);

propertySchema.pre("findOneAndUpdate", function (next) {
  this._update.dues = [
    ...this._update.dues.map((due) => ({
      needPay: due.count - due.paid,
      year: due.year,
      count: due.count,
      paid: due.paid,
    })),
  ];
  this._update.dueArrears = this._update.dues.reduce((total, next) => {
    if (next.needPay > 0) {
      return total + next.needPay;
    }
    return total;
  }, 0);
  this.getOptions.runValidators = true;
  next();
});

propertySchema.post("findOneAndUpdate", handleValidateError);

propertySchema.post("save", handleValidateError);

const Property = model("property", propertySchema);

module.exports = Property;
