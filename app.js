const express = require("express");

const cors = require("cors");

const axios = require("axios");

const { v4 } = require("uuid");

const usersRouter = require("./routes/api/users");
const propRouter = require("./routes/api/property");

const TelegramBot = require("node-telegram-bot-api");

require("dotenv").config();

const { TELEGRAM_BOT_API, SERVER_URL } = process.env;

const bot = new TelegramBot(TELEGRAM_BOT_API, {
  polling: true,
});

const userCtrl = require("./controllers/users");
const propertyCtrl = require("./controllers/property");

const {
  markUpInArray,
  formatDate,
  dayCounter,
  getLiqpayData,
} = require("./helpers");
const LIQPAY_CONSTANTS = require("./constants/liqpayConstants");
const { getAllUsersChatId } = require("./controllers/users");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/wakeup", (req, res, next) => {
  console.log("Wake Up");
  res.json({ message: true });
});

app.use("/api/users", usersRouter);

app.use(express.urlencoded({ extended: false }));
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
  {
    command: "oferta",
    description: "Договір оферти",
  },
  {
    command: "help",
    description: "Команди бота",
  },
];
bot.setMyCommands(commands);

const userCallbackData = {};
const prepareAlert = {};
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
                { text: "🏡 Ділянки", callback_data: "propertyPage" },
                { text: "📢 Новини", callback_data: "newsPage" },
              ],
              [
                { text: "👤 Моя інформація", callback_data: "personPage" },
                { text: "😪 Боржники", callback_data: "debtorPage" },
              ],
              [
                { text: "🙋‍♂️ Голосування", callback_data: "pollPage" },
                { text: "🏆 Інформація", callback_data: "aboutPage" },
              ],

              user.admin
                ? [
                    { text: "👥 Всі показники", callback_data: "allCounters" },
                    {
                      text: "📣 Написати оголошення",
                      callback_data: "writeAlert",
                    },
                  ]
                : [],

              [{ text: "🏪 На головну", callback_data: "mainPage" }],
            ],
            one_time_keyboard: true,
          },
        }
      );
    }
    if (ctx.data === "writeAlert") {
      prepareAlert[ctx.message.chat.id] = "";
      await bot.sendMessage(
        ctx.message.chat.id,
        "Напиши повідомлення, та воно відправиться усім учасникам бота!",
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: "🏪 На головну", callback_data: "mainPage" }],
            ],
          },
        }
      );
    }
    if (ctx.data === "alertAdv") {
      const messageToClient = ctx.message.text.split("Ось")[0].trim();
      const creatorName = user.name.split(" ").slice(0, 2).join(" ");

      const allUsersChatId = await getAllUsersChatId();
      const allIds = allUsersChatId
        .filter((item) => item.telegramChatId)
        .map((item) => item.telegramChatId);

      const advSender = (chatIds) => {
        const anotherIds = chatIds.splice(20);

        chatIds.forEach(async (chatPureId) => {
          await bot.sendMessage(
            chatPureId,
            `${messageToClient}\n\nАвтор: ${creatorName}`,
            {
              reply_markup: {
                inline_keyboard: [
                  [{ text: "🏪 На головну", callback_data: "mainPage" }],
                ],
              },
            }
          );
        });
        if (anotherIds) {
          setTimeout(() => {
            advSender(anotherIds);
          }, 60 * 1000);
        }
      };
      if (allIds) {
        advSender(allIds);
      }
      await bot.sendMessage(
        ctx.message.chat.id,
        "Оголошення успішно опубліковане!",
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: "🏪 На головну", callback_data: "mainPage" }],
            ],
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
            }\nДо оплати: ${prop.electricData.debt || 0}`
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
            ? `Наявна\nАктуальний показник: ${prop.electricData[0]?.current}`
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
    if (ctx.data === "propertyPage") {
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
        "Виберіть одну з доступних вам ділянок, для більш детальної інформації.",
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
      // if (!prop.hasElectic) {
      //   throw new Error(
      //     `У ділянки №${prop.propertyNumber} відсутнє підключення до світла.`
      //   );
      // }
      const electricData = prop.electricData[0];
      await bot.sendMessage(
        ctx.message.chat.id,
        `Ділянка №${prop.propertyNumber}.\n<u>ЧЛЕНСЬКІ ВНЕСКИ</u>: ${
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
          prop.hasElectic
            ? `\n\n<u>СВІТЛО</u>: \nЗаборгованість по світлу: <i>${
                electricData?.debt ?? 0
              } грн</i>.\nПокази лічильника ${
                electricData
                  ? `станом на ${electricData.date}: ${electricData.current}`
                  : "відсутні"
              }. `
            : ""
        }\n\nОберіть дію:`,
        {
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              prop.hasElectic
                ? [
                    {
                      text: "📝 Подати показник",
                      callback_data: `pokaz ${prop._id}`,
                    },
                    {
                      text: "☀️ Оплатити світло",
                      callback_data: `electricpay ${prop._id}`,
                    },
                  ]
                : [],
              [
                {
                  text: "🫂 Оплатити членський внесок",
                  callback_data: `duespay ${prop._id}`,
                },
              ],
              [
                {
                  text: "⬅️ Назад",
                  callback_data: `propertyPage`,
                },
                { text: "🏪 На головну", callback_data: "mainPage" },
              ],
            ],
          },
        }
      );
    }
    if (ctx.data.startsWith("pokaz")) {
      const propId = ctx.data.split(" ")[1];
      const prop = await propertyCtrl.getPropertyTelegramById(propId);

      const dateToday = formatDate();
      // Check date
      if (prop.electricData.length > 0) {
        if (dateToday.split(".")[0] < 27 && dateToday.split(".")[0] > 3) {
          return await bot.sendMessage(
            ctx.message.chat.id,
            `Вибачте, але показники можна подавати лише з 27 числа по 03.`,
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
        if (dayCounter(dateToday, prop.electricData[0].date) < 10) {
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
      const { propertyNumber, electricData } = prop;
      const { debt, current, _id, previous } = electricData[0];
      if (debt <= 0) {
        await bot.sendMessage(
          ctx.message.chat.id,
          "У вас відсутні заборгованості по оплаті світла!",
          {
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
      } else {
        const randomUID = v4();
        const ownerLastName = user.name.split(" ")[0];
        const json_string = {
          order_id: `${randomUID}`,
          customer: `${prop._id}`,
          server_url: `${SERVER_URL}/api/prop/electricstatus`,
          ...LIQPAY_CONSTANTS,
          amount: Number(debt) * 1.02,
          description: `Оплата за спожиту електроенергію згідно показників(${previous} - ${current}). Ділянка №${propertyNumber} (${ownerLastName}).`,
        };
        const { signature, data } = getLiqpayData(json_string);
        axios
          .post(
            `https://www.liqpay.ua/api/3/checkout?data=${data}&signature=${signature}`
          )
          .then(async (data) => {
            await bot.sendMessage(
              ctx.message.chat.id,
              `Сума згідно заборгованостей: ${Number(debt)} грн. Комісія 2%: ${
                Number(debt) * 0.02
              } грн. До оплати: ${(Number(debt) * 1.02).toFixed(
                2
              )} грн.\nТепер вам потрібно перейти на сайт оплати компанії "LiqPay".\nЩоб перейти до оплати, натисніть кнопку нижче ⬇️`,
              {
                reply_markup: {
                  inline_keyboard: [
                    [
                      {
                        text: "💰 Перейти на сайт оплати",
                        url: `${data.request.res.responseUrl}`,
                      },
                    ],
                    [
                      {
                        text: "⬅️ Назад",
                        callback_data: `properties ${prop._id}`,
                      },
                      { text: "🏪 На головну", callback_data: "mainPage" },
                    ],
                  ],
                  one_time_keyboard: true,
                },
              }
            );
          });
      }
    }
    if (ctx.data.startsWith("duespay")) {
      const prop = await propertyCtrl.getPropertyTelegramById(
        ctx.data.split(" ")[1]
      );
      const { propertyNumber, dueArrears, dues } = prop;

      if (dueArrears <= 0) {
        await bot.sendMessage(
          ctx.message.chat.id,
          "У вас відсутні заборгованості по оплаті членських внесків!",
          {
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
      } else {
        const randomUID = v4();
        const ownerLastName = user.name.split(" ")[0];
        const unpaidYears = dues
          .filter((item) => item.needPay > 0)
          .map((item) => item.year);

        const json_string = {
          order_id: `${randomUID}`,
          customer: `${prop._id}`,
          server_url: `${SERVER_URL}/api/prop/duestatus`,
          ...LIQPAY_CONSTANTS,
          amount: Number(dueArrears) * 1.02,
          description: `Оплата членського внеску за [${unpaidYears.join(
            ", "
          )}]. Ділянка №${propertyNumber} (${ownerLastName}).`,
        };

        const { signature, data } = getLiqpayData(json_string);
        axios
          .post(
            `https://www.liqpay.ua/api/3/checkout?data=${data}&signature=${signature}`
          )
          .then(async (data) => {
            await bot.sendMessage(
              ctx.message.chat.id,
              `Сума згідно заборгованостей: ${Number(
                dueArrears
              )} грн. Комісія 2%: ${
                Number(dueArrears) * 0.02
              } грн. До оплати: ${(Number(dueArrears) * 1.02).toFixed(
                2
              )} грн.\nТепер вам потрібно перейти на сайт оплати компанії "LiqPay".\nЩоб перейти до оплати, натисніть кнопку нижче ⬇️`,
              {
                reply_markup: {
                  inline_keyboard: [
                    [
                      {
                        text: "💰 Перейти на сайт оплати",
                        url: `${data.request.res.responseUrl}`,
                      },
                    ],
                    [
                      {
                        text: "⬅️ Назад",
                        callback_data: `properties ${prop._id}`,
                      },
                      { text: "🏪 На головну", callback_data: "mainPage" },
                    ],
                  ],
                  one_time_keyboard: true,
                },
              }
            );
          });
      }
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
      if (user.phone === "0112223344") {
        return await bot.sendMessage(
          ctx.message.chat.id,
          "🔴 Немає актуальних новин! 🔴",
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: "🏪 На головну", callback_data: "mainPage" }],
              ],
            },
          }
        );
      }
      await bot.sendMessage(
        ctx.message.chat.id,
        "🔴 Членські внески за 2024 рік.🔴\n\nНагадуємо за внески у 2024 році - 1440 грн.\nДане рішення було прийнято на зборах в липні 23 року. \n\nОплату потрібно всім членам кооперативу ОБОВ'ЯЗКОВО закрити. \nОплатити можете у Телеграм Боті перейшовши на \nГоловну Сторінку > Ділянки > Ділянка № > Оплатити членський внесок. \n\nЗ повагою, Правління СГК 'СТИМУЛ'.",
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
    if (ctx.data === "aboutPage") {
      await bot.sendMessage(
        ctx.message.chat.id,
        `САДОВО-ГОРОДНЄ ТОВАРИСТВО СТИМУЛ
Юридична адреса:
81084, С.КОЖИЧІ, ВУЛ.ЦЕНТРАЛЬНА БУД.- ,
Ідентифікаційний код юридичної особи - 36031384
Голова кооперативу - Дубан Назар
Контакти: stymulhome@gmail.com
\nАктуальні тарифи та оплати на ${new Date().getFullYear()} рік\n1. Тариф електроенергії - 3 грн/кВт\n2. Тариф на річний членський внесок - 1440 грн/рік.`,
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
      const demoPhoneNumber = "0112223344";
      const demoUser = await userCtrl.getUserTelegramByPhone(demoPhoneNumber);

      if (demoUser.telegramChatId === msg.chat.id.toString()) {
        const updatedUser = await userCtrl.addTelegramChatIdToUser(
          "0112223344",
          ""
        );
      }

      await bot.sendMessage(
        msg.chat.id,
        `Для ідентифікації власника ділянки потрібно поділитись номером мобільного телефону.`,
        {
          reply_markup: {
            keyboard: [
              [
                { text: "Поділитись номером телефону", request_contact: true },
                // "💼 Демо-кабінет",
              ],
            ],
            one_time_keyboard: true,
            is_persistent: true,
            resize_keyboard: true,
          },
        }
      );
    } else if (msg.text == "💼 Демо-кабінет") {
      const updatedUser = await userCtrl.addTelegramChatIdToUser(
        "0112223344",
        msg.chat.id
      );
      await bot.sendMessage(
        msg.chat.id,
        `Вітаю ви обрали демо-версію. \n\nТепер ви можете перейти на головну сторінку`,
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: "🏪 На головну", callback_data: "mainPage" }],
            ],
          },
        }
      );
    } else if (msg.text == "/help") {
      await bot.sendMessage(
        msg.chat.id,
        `Команди бота: \n/start - перезапустити бот\n/oferta - договір публічної оферти\n/help - усі команди`
      );
    } else if (msg.text == "/oferta") {
      await bot.sendMessage(
        msg.chat.id,
        `ПУБЛІЧНИЙ ДОГОВІР (ОФЕРТА)\n
Цей договір є офіційною та публічною пропозицією Садового товариства укласти договір надання послуг, представленого у боті https://t.me/stymulBot. Даний договір є публічним, тобто відповідно до статті 633 Цивільного кодексу України, його умови є однаковими для всіх користувачів незалежно від їх статусу без надання переваги одному перед іншим. Шляхом укладення цього Договору користувач в повному обсязі приймає умови та порядок оформлення послуг, оплати послуг, відповідальності за недобросовісне надання послуг та усі інші умови договору. Договір вважається укладеним з моменту реєстраці користувача у системі, а саме введення Пін-коду користувача для  авторизації у чат-боті.
\n1. Визначення термінів
1.1. Публічна оферта (далі - «Оферта») - публічна пропозиція Виконавця, адресована невизначеному колу осіб, укласти з Виконавцем договір надання послуг дистанційним способом (далі - «Договір») на умовах, що містяться в цій Оферті.
1.2. Послуга – об'єкт угоди сторін, який був обраний користувачем у Боті, або вже оплачений Користувачем у Виконавця дистанційним способом.
1.3. Бот – сторінка у додатку "Telegram" за адресою https://t.me/stymulBot створений для ознайомлення з послугами та оплати послуг на підставі ознайомлення Користувача із запропонованим Виконавцем описом Послуг за допомогою мережі Інтернет.
1.4. Користувач – дієздатна фізична особа, яка досягла 18 років, отримує інформацію від Виконавця.
1.5. Виконавець – Садово Городнє Товариство «Стимул» (ідентифікаційний код 36031384), юридична особа, яка створена і діє відповідно до чинного законодавства України, місцезнаходження якої: 81084, С.КОЖИЧІ, ВУЛ.ЦЕНТРАЛЬНА БУД.- ,
1.6. Пін-код - набір цифр який вводить Користувач для підтвердження особистості при реєстрації у Боті.
\n2. Предмет Договору
2.1. Виконавець зобов’язується надати Послуги Користувачеві, а Користувач зобов’язується оплатити і прийняти Послуги на умовах цього Договору.
2.2. Датою укладення Договору-оферти (акцептом оферти) та моментом повного й беззаперечного прийняттям Користувача умов Договору вважається дата оплати Користувачем наданих послуг.
\n3. Оформлення Замовлення
3.1. Користувач самостійно вибирає послуги в Боті.
3.2. Найменування послуги вказуються в Боті при натисканні на кнопку Оплата.
3.3. Ухвалення Користувачем умов цієї Оферти здійснюється за допомогою внесення Користувачем відповідних даних в реєстраційну форму у Боті.
3.4. Укладаючи Договір, тобто акцептуючи умови даної пропозиції (запропоновані умови надання послуг), шляхом оплати за послуги, Користувач підтверджує наступне:
а) Користувач цілком і повністю ознайомлений, і згоден з умовами цієї пропозиції (оферти);
б) він дає дозвіл на збір, обробку та передачу персональних даних, дозвіл на обробку персональних даних діє протягом усього терміну дії Договору, а також протягом необмеженого терміну після закінчення його дії. Крім цього, укладенням договору Користувач підтверджує, що він повідомлений (без додаткового повідомлення) про права, встановлених Законом України "Про захист персональних даних", про цілі збору даних, а також про те, що його персональні дані передаються Виконавцю з метою можливості виконання умов цього Договору, можливості проведення взаєморозрахунків, а також для отримання рахунків, актів та інших документів. Користувач також погоджується з тим, що Виконавець має право надавати доступ та передавати його персональні дані третім особам без будь-яких додаткових повідомлень Користувача з метою виконання послуги Користувача. Обсяг прав Користувача, як суб'єкта персональних даних відповідно до Закону України "Про захист персональних даних" йому відомий і зрозумілий.
`
      );
      await bot.sendMessage(
        msg.chat.id,
        `\n4. Умови та порядок сплати послуг
4.1. Ціни Послуги визначаються Виконавцем самостійно та вказані у Боті.
4.2. Ціни на Послуги можуть змінюватися Виконавцем в односторонньому порядку залежно від кон'юнктури ринку. При цьому ціна окремої одиниці Послуги, вартість якої оплачена Користувачем в повному обсязі, не може бути змінена Виконавцем в односторонньому порядку.
4.3. Комісія за оплату Послуги через застосунок LiqPay становить 2% від суми Послуги. Комісія додається до суми Послуги при оплаті через сервіс LiqPay. А інформація про вартість комісії відображається у Боті.
4.4. Комісія стягується за прискорене обслуговування та за фактичну зручність оплати через сервіс LiqPay.
4.5. Зобов'язання Користувача по оплаті Послуги вважаються виконаними з моменту надходження Виконавцю коштів на його рахунок.
4.6. Розрахунки у цьому Боті між Виконавцем і Користувачем за Послуги здійснюються за допомогою платіжного сервісу LiqPay та отримувачем коштів є "ОК САДОВО-ГОРОДНЄ ТОВАРИСТВО СТИМУЛ".
4.7. У разі неможливості або відмови скористатися послугами Виконавця, Користувач не пізніше ніж за 1 (один) календарний місяць до дати надання послуги, зазначеної в рахунку, письмово повідомляє Виконавця про це. Виконавець на підставі письмової заяви здійснює повернення сплачених Користувачем коштів протягом 1 (одного) календарного місяця з дня надання Користувачем письмової заяви із зазначенням реквізитів рахунку Користувача.
4.8. У разі неможливості чи відмови скористатися послугами Виконавця менше ніж за 1 (один) календарний місяцт до дати надання послуг, оплата, внесена Користувачем за послуги, не повертається, якщо інше не погоджено Виконавцем та Користувачем.
\n5. Права та обов’язки Сторін
5.1. Виконавець зобов’язаний:
5.1.1. Передати Користувачеві Послуги у відповідності до умов цього Договору та замовлення Користувача.
5.1.2. Не розголошувати будь-яку приватну інформацію про Користувача і не надавати доступ до цієї інформації третім особам, за винятком випадків, передбачених законодавством та під час виконання Послеги для Користувача.
5.2. Виконавець має право:
5.2.1 Змінювати умови цього Договору, а також ціни на Послуги, в односторонньому порядку, розміщуючи їх у Боті. Всі зміни набувають чинності з моменту їх публікації.
5.3 Користувач зобов'язується:
5.3.1 До моменту укладення Договору ознайомитися зі змістом Договору, умовами Договору і цінами, запропонованими Виконавцем у Боті.
5.3.2 На виконання Виконавцем своїх зобов'язань перед Користувачем останній повинен повідомити всі необхідні дані, що однозначно ідентифікують його як Користувача, і достатні для надавання Послуги.
`
      );
      await bot.sendMessage(
        msg.chat.id,
        `\n6. Відповідальність
6.1. Виконавець не несе відповідальності за шкоду, заподіяну Користувачеві або третім особам внаслідок неналежного монтажу, використання обладнання яке служить для надання Послуги.
6.2. Виконавець не несе відповідальності за неналежне, несвоєчасне виконання Послуги і своїх зобов’язань у випадку надання Користувачем недостовірної або помилкової інформації.
6.3. Виконавець і Користувач несуть відповідальність за виконання своїх зобов'язань відповідно до чинного законодавства України і положень цього Договору.
6.4. Виконавець або Користувач звільняються від відповідальності за повне або часткове невиконання своїх зобов'язань, якщо невиконання є наслідком форс-мажорних обставин як: війна або військові дії, землетрус, повінь, пожежа та інші стихійні лиха, що виникли незалежно від волі Виконавця і / або Користувача після укладення цього договору. Сторона, яка не може виконати свої зобов'язання, негайно повідомляє про це іншу Сторону.
\n7. Конфіденційність і захист персональних даних.
7.1. Надаючи свої персональні дані у Боті при реєстрації, Користувач надає Виконавцеві свою добровільну згоду на обробку, використання (у тому числі і передачу) своїх персональних даних, а також вчинення інших дій, передбачених Законом України «Про захист персональних даних», без обмеження терміну дії такої згоди.
7.2. Виконавець зобов'язується не розголошувати отриману від Користувача інформацію. Не вважається порушенням надання Виконавцем інформації контрагентам і третім особам, що діють на підставі договору з Виконавцем, в тому числі і для виконання зобов'язань перед Користувачем, а також у випадках, коли розкриття такої інформації встановлено вимогами чинного законодавства України.
7.3. Користувач несе відповідальність за підтримання своїх персональних даних в актуальному стані. Виконавець не несе відповідальності за неякісне виконання або невиконання своїх зобов'язань у зв'язку з неактуальністю інформації про Користувача або невідповідністю її дійсності.
\n8. Інші умови
8.1. Цей договір укладено на території України і діє відповідно до чинного законодавства України.
8.2. Усі спори, що виникають між Виконавцем і Користувачем, вирішуються шляхом переговорів. У випадку недосягнення врегулювання спірного питання шляхом переговорів, Користувач та/або Виконавець мають право звернутися за вирішенням спору до судових органів відповідно до чинного законодавства України.
8.3. Виконавець має право вносити зміни до цього Договору в односторонньому порядку, передбаченому п. 5.2.1. Договору. Крім того, зміни до Договору також можуть бути внесені за взаємною згодою Сторін в порядку, передбаченому чинним законодавством України. `
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
    } else if (prepareAlert.hasOwnProperty(msg.chat.id)) {
      await bot.sendMessage(
        msg.chat.id,
        `${msg.text}\n\nОсь так виглядатиме ваше оголошення. Ви дійсно бажаєте його опублікувати для всіх?`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                { text: "🔉 Опублікувати", callback_data: "alertAdv" },
                { text: "🏪 На головну", callback_data: "mainPage" },
              ],
            ],
          },
        }
      );
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
      "Введіть ваш Пін-код, для авторизації в додатку. Пін-код можна дізнатись у правління кооперативу.\n\nВведенням Пін-коду ви підтверджуєте, що ознайомлені та погоджуєтесь з умовами договору публічної оферти, який знаходиться у мені цього Бота при введені /oferta або при виборі 'Договір Оферти' у меню цього Бота.",
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
