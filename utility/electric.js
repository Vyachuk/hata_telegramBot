const { formatDate } = require("../helpers");

const electricExample = (propId, plan, electricTariff = 3) => {
  const { fullDate } = formatDate();
  return {
    propId,
    plan,
    electricTariff,
    pro:
      plan === "standart"
        ? []
        : [
            {
              current: {
                day: 0,
                night: 0,
              },
              previous: {
                day: 0,
                night: 0,
              },
              forPay: 0,
              paid: 0,
              debt: 0,
            },
          ],
    standart:
      plan === "standart"
        ? [
            {
              current: 0,
              previous: 0,
              forPay: 0,
              paid: 0,
              debt: 0,
            },
          ]
        : [],
    updateAt: fullDate,
  };
};

module.exports = electricExample;
