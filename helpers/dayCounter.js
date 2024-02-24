const dayCounter = (nowDate, previousDate) => {
  return Math.ceil(
    Math.abs(new Date(nowDate) - new Date(previousDate)) / (1000 * 3600 * 24)
  );
};

module.exports = dayCounter;
