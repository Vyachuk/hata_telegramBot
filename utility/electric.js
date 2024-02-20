const electricExample = ({ propId, plan, electricTariff = 3 }) => {
  return {
    propId,
    plan,
    electricTariff,
    pro: [],
    standart: [],
  };
};

module.exports = electricExample;
