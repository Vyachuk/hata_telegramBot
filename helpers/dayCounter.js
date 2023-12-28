const dayCounter = (nowDate, previousDate) => {
  const now = new Date(nowDate.split(".").reverse().join("-")).getTime();
  const prev = new Date(previousDate.split(".").reverse().join("-")).getTime();
  return (now - prev) / (1000 * 60 * 60 * 24);
};

module.exports = dayCounter;
