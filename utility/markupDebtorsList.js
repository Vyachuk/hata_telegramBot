const markupDebtorsList = async (allDebtors) => {
  const result = [];

  for (const debtor of allDebtors) {
    result.push(
      `- ${debtor.name.split(" ").slice(0, 2).join(" ")} (${
        debtor.propertyNumber
      }) - ${debtor.dueArrears} грн.`
    );
  }

  return result;
};

module.exports = markupDebtorsList;
