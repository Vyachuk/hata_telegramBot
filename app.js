const express = require("express");

const cors = require("cors");

const axios = require("axios");

const usersRouter = require("./routes/api/users");
const propRouter = require("./routes/api/property");

const TelegramBot = require("node-telegram-bot-api");

require("dotenv").config();

const { TELEGRAM_BOT_API } = process.env;

const bot = new TelegramBot(TELEGRAM_BOT_API, {
  polling: true,
});

const userCtrl = require("./controllers/users");
const propertyCtrl = require("./controllers/property");

const { markUpInArray, formatDate } = require("./helpers");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/wakeup", (req, res, next) => {
  console.log("Wake Up");
  res.json({ message: true });
});

app.use("/api/users", usersRouter);
app.use("/api/prop", propRouter);

app.use((req, res) => {
  res.status(404).json({ message: "Not found" });
});

app.use((err, req, res, next) => {
  const { status = 500, message } = err;
  console.log(err);
  res.status(status).json({ message });
});

// TELEGRAM BOT
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_API}`;
const URI = `/webhook/${TELEGRAM_BOT_API}`;
const webhookURL = `${"https://hata-telegrambot.onrender.com"}${URI}`;

const setupWebhook = async () => {
  try {
    const { data } = await axios.get(
      `${TELEGRAM_API}/setWebhook?url=${webhookURL}&drop_pending_updates=true`
    );
  } catch (error) {
    return error;
  }
};

const commands = [
  {
    command: "start",
    description: "Перезапустити бота",
  },
];
bot.setMyCommands(commands);

const userCallbackData = {};
bot.on("callback_query", async (ctx) => {
  try {
    const user = await userCtrl.getUserByChatId(ctx.message.chat.id);

    if (ctx.data === "mainPage") {
      await bot.sendMessage(
        ctx.message.chat.id,
        `Тут ви можете обрати інформацію яка вас цікавить.`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                { text: "⚡️ Світло", callback_data: "electricPage" },
                { text: "📢 Новини", callback_data: "newsPage" },
              ],
              [
                { text: "👤 Моя інформація", callback_data: "personPage" },
                { text: "😪 Боржники", callback_data: "debtorPage" },
              ],
              [{ text: "🙋‍♂️ Голосування", callback_data: "pollPage" }],

              user.admin && [
                { text: "👥 Всі показники", callback_data: "allCounters" },
              ],

              [{ text: "🏪 На головну", callback_data: "mainPage" }],
            ],
            one_time_keyboard: true,
          },
        }
      );
    }
    if (ctx.data === "allCounters") {
      if (!user.admin) {
        await bot.sendMessage(ctx.message.chat.id, "", {
          reply_markup: {
            inline_keyboard: [
              [{ text: "🏪 На головну", callback_data: "mainPage" }],
            ],
          },
        });
      } else {
        const allProperty = await propertyCtrl.getAllPropertyTelegram();
        const sortedProperty = allProperty.sort((a, b) => {
          const dateA = new Date(
            a.electricData.date.split(".").reverse().join("-")
          );
          const dateB = new Date(
            b.electricData.date.split(".").reverse().join("-")
          );

          return dateB - dateA;
        });
        await bot.sendMessage(
          ctx.message.chat.id,
          "<b>.................. Початок списку ..................</b>",
          {
            parse_mode: "HTML",
          }
        );

        for (const prop of sortedProperty) {
          const propertyUser = await userCtrl.getUserTelegramById(prop.ownerId);

          await bot.sendMessage(
            ctx.message.chat.id,
            `Ім'я: ${propertyUser.name
              .split(" ")
              .slice(0, 2)
              .join(" ")}\nПоказник: ${prop.electricData.current} | Дата: ${
              prop.electricData.date
            }\nДо оплати: ${prop.electricData.forPay}`
          );
        }

        await bot.sendMessage(
          ctx.message.chat.id,
          " <b>.................. Кінець списку ..................</b> ",
          {
            parse_mode: "HTML",
            reply_markup: {
              inline_keyboard: [
                [{ text: "🏪 На головну", callback_data: "mainPage" }],
              ],
            },
          }
        );
      }
    }

    if (ctx.data === "personPage") {
      let message = `Імя: ${user.name}\nВступний членський внесок: ${
        user.enterFee.isAvailable
          ? `${
              user.enterFee.needToPay > 0
                ? `до сплати <b><i>${user.enterFee.needToPay}</i></b> грн.`
                : "<b><i>[Оплачено]</i></b>"
            }`
          : "Відсутній"
      }\n\n<b>Ділянки:</b>`;

      for (const [idx, id] of user.owned.entries()) {
        const prop = await propertyCtrl.getPropertyTelegramById(id);

        message += `\n    -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-\n\nДілянка №${
          prop.propertyNumber
        }\nПлоща: ${prop.area}\nКадастровий номер: ${
          prop.kadastrId
        }\nДата покупки: ${prop.ownershipDate}\nЕлектрика: ${
          prop.hasElectic
            ? `Наявна\nТариф: ${prop.electricTariff} грн.\nАктуальний показник: ${prop.electricData[0].current}`
            : `Відсутня`
        }\n\n<u>Не оплачені членські внески</u>: ${
          prop.dueArrears &&
          prop.dues
            .filter((item) => item.needPay > 0)
            .map((item) => {
              if (item.needPay > 0) {
                return `\n- ${item.year} рік: <b><i>${item.needPay} грн</i></b>`;
              }
            })
        }\n<u>Загалом</u>: <b><i>${prop.dueArrears} грн</i></b>.`;
      }
      await bot.sendMessage(ctx.message.chat.id, message, {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [{ text: "🏪 На головну", callback_data: "mainPage" }],
          ],
        },
      });
    }
    if (ctx.data === "electricPage") {
      const markup = [];
      for (const [_, id] of user.owned.entries()) {
        const { propertyNumber } = await propertyCtrl.getPropertyTelegramById(
          id
        );

        markup.push({
          text: `🏡 Ділянка №${propertyNumber}`,
          callback_data: `properties ${id}`,
        });
      }
      const newMarkUp = markUpInArray(markup);
      await bot.sendMessage(
        ctx.message.chat.id,
        "Виберіть одну з доступних вам ділянок, для більш детальної інформації щодо електроенергії.",
        {
          reply_markup: {
            inline_keyboard: [
              ...newMarkUp,
              [{ text: "🏪 На головну", callback_data: "mainPage" }],
            ],
          },
        }
      );
    }
    if (ctx.data.startsWith("properties")) {
      const prop = await propertyCtrl.getPropertyTelegramById(
        ctx.data.split(" ")[1]
      );
      if (!prop.hasElectic) {
        throw new Error(
          `У ділянки №${prop.propertyNumber} відсутнє підключення до світла.`
        );
      }
      const electricData = prop.electricData[0];
      await bot.sendMessage(
        ctx.message.chat.id,
        `Ділянка №${prop.propertyNumber}. \n<u>Заборгованість</u>: <i>${
          electricData?.debt ?? 0
        } грн</i>.\nПокази лічильника ${
          electricData
            ? `станом на ${electricData.date}: ${electricData.current}`
            : "відсутні"
        }. Оберіть дію: `,
        {
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "📝 Подати показник",
                  callback_data: `pokaz ${prop._id}`,
                },
                {
                  text: "💰 Оплатити",
                  callback_data: `electricpay ${prop._id}`,
                },
              ],
              [{ text: "🏪 На головну", callback_data: "mainPage" }],
            ],
          },
        }
      );
    }
    if (ctx.data.startsWith("pokaz")) {
      const propId = ctx.data.split(" ")[1];
      const prop = await propertyCtrl.getPropertyTelegramById(propId);

      const dateToday = formatDate();
      if (prop.electricData.length > 0) {
        if (
          prop.electricData[0].date.split(".")[1] === dateToday.split(".")[1]
        ) {
          return await bot.sendMessage(
            ctx.message.chat.id,
            `Ви уже подавали показник цього місяця. \nАктуальний показник <u><i>${prop.electricData[0].current}</i></u> був поданий <u><i>${prop.electricData[0].date}</i></u>.\nПоказник можна буде подати з початку наступного місяця.  \nЯкщо ви допустили помилку, зверніться до <ins>правління кооперативу</ins>.`,
            {
              parse_mode: "HTML",
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: "⬅️ Назад",
                      callback_data: `properties ${prop._id}`,
                    },
                    { text: "🏪 На головну", callback_data: "mainPage" },
                  ],
                ],
              },
            }
          );
        }
      }
      await bot.sendMessage(
        ctx.message.chat.id,
        "Подайте актуальний показник лічильника:",
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: "🏪 На головну", callback_data: "mainPage" }],
            ],
          },
        }
      );
      userCallbackData[ctx.message.chat.id] = {
        propId,
      };
    }
    if (ctx.data.startsWith("electricpay")) {
      const prop = await propertyCtrl.getPropertyTelegramById(
        ctx.data.split(" ")[1]
      );
      await bot.sendMessage(
        ctx.message.chat.id,
        "Ця послуга поки що недоступна!",
        {
          reply_markup: {
            inline_keyboard: [
              [
                { text: "⬅️ Назад", callback_data: `properties ${prop._id}` },
                { text: "🏪 На головну", callback_data: "mainPage" },
              ],
            ],
          },
        }
      );
    }
    if (ctx.data === "debtorPage") {
      await bot.sendMessage(
        ctx.message.chat.id,
        "Скоро тут появиться список осіб, які не оплатили членські внески за 2023 рік та раніше.",
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: "🏪 На головну", callback_data: "mainPage" }],
            ],
          },
        }
      );
    }
    if (ctx.data === "newsPage") {
      await bot.sendMessage(
        ctx.message.chat.id,
        "🔴 Членські внески за 2023 рік.🔴\n\nНагадуємо за внески з липня по грудень 2023 року - 720 грн.\nДане рішення було прийнято на зборах в липні 23 року. \n\nОплату потрібно всім членам кооперативу ОБОВ'ЯЗКОВО закрити. \nКошти можна передати кожному із членів правління. \nЗ повагою, Правління СГК 'СТИМУЛ'.",
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: "🏪 На головну", callback_data: "mainPage" }],
            ],
          },
        }
      );
    }
    if (ctx.data === "pollPage") {
      await bot.sendMessage(
        ctx.message.chat.id,
        "Немає актуальних голосувань!",
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: "🏪 На головну", callback_data: "mainPage" }],
            ],
          },
        }
      );
    }
    const emptyKeyboard = { reply_markup: { inline_keyboard: [] } };

    bot.editMessageReplyMarkup(emptyKeyboard, {
      chat_id: ctx.message.chat.id,
      message_id: ctx.message.message_id,
    });
  } catch (error) {
    await bot.sendMessage(ctx.message.chat.id, error.message, {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🏪 На головну", callback_data: "mainPage" }],
        ],
      },
    });
  }
});

bot.on("text", async (msg) => {
  try {
    if (msg.text == "/start") {
      await bot.sendMessage(
        msg.chat.id,
        `Для ідентифікація власника ділянки потрібно поділитись номером мобільного телефону.`,
        {
          reply_markup: {
            keyboard: [
              [{ text: "Поділитись номером телефону", request_contact: true }],
            ],
            one_time_keyboard: true,
            is_persistent: true,
            resize_keyboard: true,
          },
        }
      );
    } else if (msg.text == "/giveid") {
      await bot.sendMessage(msg.chat.id, msg.chat.id);
    } else if (userCallbackData[msg.chat.id]?.userPhone) {
      const phoneNumer = userCallbackData[msg.chat.id].userPhone;
      const findedUser = await userCtrl.getUserTelegramByPhone(phoneNumer);
      if (findedUser.pinCode !== msg.text) {
        throw new Error("Ви ввели некоректний пароль, спробуйте ще раз.");
      }

      const updatedUser = await userCtrl.addTelegramChatIdToUser(
        phoneNumer,
        msg.chat.id
      );
      await bot.sendMessage(
        msg.chat.id,
        `${updatedUser.name} ідентифікація успішно завершена. \n\nТепер ви можете перейти на головну сторінку`,
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: "🏪 На головну", callback_data: "mainPage" }],
            ],
          },
        }
      );

      delete userCallbackData[msg.chat.id];
    } else if (userCallbackData[msg.chat.id]?.propId) {
      const propertyId = userCallbackData[msg.chat.id].propId;
      const prop = await propertyCtrl.getPropertyTelegramById(propertyId);
      if (prop.electricData.length > 0) {
        if (Number(msg.text) < prop.electricData[0].current) {
          return await bot.sendMessage(
            msg.chat.id,
            "Показник повинен бути більшим за минулий. Впишіть коректний показник."
          );
        }
      }
      const electricDataExists = prop.electricData.length > 0;
      const electricData = electricDataExists ? prop.electricData[0] : null;
      const forPay =
        (Number(msg.text) - (electricData?.current || 0)) *
          prop.electricTariff +
        (electricData?.debt || 0);

      await propertyCtrl.addTelegramElecticData(propertyId, [
        {
          date: formatDate(),
          current: Number(msg.text),
          previous: electricDataExists ? electricData.current : 0,
          forPay: forPay,
          paid: 0,
          debt: forPay,
        },
        ...prop.electricData,
      ]);
      await bot.sendMessage(
        msg.chat.id,
        `Показник <i>${
          msg.text
        }</i> успішно поданий. Борг за минулі місяці: <i>${
          prop.electricData[0]?.debt ?? 0
        }</i>. До оплати: <i>${
          (Number(msg.text) -
            ((prop.electricData[0] && prop.electricData[0].current) || 0)) *
            prop.electricTariff +
          (prop.electricData[0]?.debt || 0)
        } грн</i>.`,
        {
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [{ text: "🏪 На головну", callback_data: "mainPage" }],
            ],
          },
        }
      );

      delete userCallbackData[msg.chat.id];
    } else {
      const user = await userCtrl.getUserByChatId(msg.chat.id);
      if (!user) {
        await bot.sendMessage(
          msg.chat.id,
          "Ви не авторизовані, будь-ласка пройдіть реєстрацію."
        );
      } else {
        await bot.sendMessage(
          msg.chat.id,
          "Я вас не розумію. Виберіть пункт із меню:",
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: "🏪 На головну", callback_data: "mainPage" }],
              ],
            },
          }
        );
      }
    }
  } catch (error) {
    await bot.sendMessage(msg.chat.id, error.message);
  }
});

bot.on("contact", async (contact) => {
  try {
    const userPhone = contact.contact.phone_number.slice(2);
    const findUser = await userCtrl.getUserTelegramByPhone(userPhone);
    if (!findUser) {
      throw new Error(
        "У доступі відмовлено. Ваш мобільний не знайдено в базі даних."
      );
    }
    userCallbackData[contact.chat.id] = {
      userPhone,
    };
    await bot.sendMessage(
      contact.chat.id,
      "Введіть ваш PIN код, для авторизації в додатку. PIN код можна дізнатись у правління кооперативу.",
      {
        reply_markup: {
          remove_keyboard: true,
        },
      }
    );
  } catch (error) {
    return await bot.sendMessage(contact.chat.id, error.message);
  }
});

bot.on("polling_error", (err) => console.log(err.response.body));

module.exports = { app };
