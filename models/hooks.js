const handleValidateError = (error, data, next) => {
  error.status = error.code === 11000 ? 409 : 400;
  next();
};

const runUpdateValidators = function (next) {
  this.getOptions.runValidators = true;
  next();
};

module.exports = {
  handleValidateError,
  runUpdateValidators,
};
