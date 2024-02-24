const markupPropertyPage = async (prop, elec) => {
  let electricData;
  let coolDate;
  if (elec) {
    electricData = elec[elec?.plan][0];
    coolDate = elec?.updateAt.split("-").reverse().join(".");
  }

  return `Ділянка №${prop.propertyNumber}.\n<u>ЧЛЕНСЬКІ ВНЕСКИ</u>: ${
    prop.dueArrears
      ? `${prop.dues
          .filter((item) => item.needPay > 0)
          .map((item) => {
            if (item.needPay > 0) {
              return `\n- ${item.year} рік: <b><i>${item.needPay} грн</i></b>`;
            }
          })}\nЗагалом: <b><i>${prop.dueArrears} грн</i></b>.`
      : "у вас все оплачено."
  }${
    prop.isElectic
      ? `\n\n<u>СВІТЛО</u>: \nЗаборгованість по світлу: <i>${
          electricData?.debt ?? 0
        } грн</i>.\nПокази лічильника ${
          electricData
            ? `станом на ${coolDate}: ${
                elec.plan === "standart"
                  ? electricData.current
                  : `[День - ${electricData.current.day}, Ніч - ${electricData.current.night}]`
              }`
            : "відсутні"
        }. `
      : ""
  }\n\nОберіть дію:`;
};

module.exports = markupPropertyPage;
