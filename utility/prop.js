const propExample = (duesPaid) => {
  const oldSumm = duesPaid.oldPeople ? 200 : 300;

  return {
    electricTariff: 3,
    hasElectic: false,
    electricData: [],
    dues: [
      {
        year: 2019,
        needPay: duesPaid.oldYears ? 0 : oldSumm,
        count: oldSumm,
        paid: duesPaid.oldYears ? oldSumm : 0,
      },
      {
        year: 2020,
        needPay: duesPaid.oldYears ? 0 : oldSumm,
        count: oldSumm,
        paid: duesPaid.oldYears ? oldSumm : 0,
      },
      {
        year: 2021,
        needPay: duesPaid.oldYears ? 0 : oldSumm,
        count: oldSumm,
        paid: duesPaid.oldYears ? oldSumm : 0,
      },
      {
        year: 2022,
        needPay: duesPaid.oldYears ? 0 : oldSumm,
        count: oldSumm,
        paid: duesPaid.oldYears ? oldSumm : 0,
      },
      {
        year: 2023,
        needPay: duesPaid["2023"] ? 0 : 720,
        count: 720,
        paid: duesPaid["2023"] ? 720 : 0,
      },
      {
        year: 2024,
        needPay: duesPaid["2024"] ? 0 : 1440,
        count: 1440,
        paid: duesPaid["2024"] ? 1440 : 0,
      },
    ],
    dueArrears: 3360,
  };
};

module.exports = propExample;
