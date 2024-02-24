const { getPropertyBy } = require("../controllers/property");
const { getUserTelegramById } = require("../controllers/users");
const sortElectricData = require("./sortElectricData");

const markupAllElectricity = async (allElectricity) => {
  const sortElectric = sortElectricData(allElectricity);
  const result = []; // Array to accumulate strings

  for (const elec of sortElectric) {
    const prop = await getPropertyBy({ _id: elec.propId });
    const { name } = await getUserTelegramById(prop.ownerId);
    const { plan, updateAt } = elec;
    const elecData = elec[plan][0];
    const coolDate = updateAt.split("-").reverse().join(".");

    result.push(
      `Ім'я: ${name.split(" ").slice(0, 2).join(" ")} (${
        prop.propertyNumber
      })\nПоказник: ${
        plan === "standart"
          ? elecData?.current ?? 0
          : `[День - ${elecData?.current.day ?? 0}, Ніч - ${
              elecData?.current.night ?? 0
            }]`
      } | Дата: ${coolDate}\nДо оплати: ${elecData?.debt ?? 0}`
    );
  }

  return result; // Return the array of strings
};

module.exports = markupAllElectricity;
