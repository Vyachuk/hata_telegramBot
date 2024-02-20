const userExample = ({ isAvailable, isPaid }) => {
  return {
    owned: [],
    enterFee: {
      isAvailable: isAvailable,
      paid: isPaid && isAvailable ? 3000 : 0,
      count: isAvailable ? 3000 : 0,
      needToPay: isAvailable && !isPaid ? 3000 : 0,
    },
    pinCode: `${Math.floor(Math.random() * 9000) + 1000}`,
  };
};

module.exports = userExample;
