const express = require("express");

const cors = require("cors");

const axios = require("axios");

// const TelegramBot = require("node-telegram-bot-api");

require("dotenv").config();

const { TELEGRAM_BOT_API } = process.env;

// const bot = new TelegramBot(TELEGRAM_BOT_API, {
//   polling: true,
// });

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

app.use((req, res) => {
  res.status(404).json({ message: "Not found" });
});

app.use((err, req, res, next) => {
  const { status = 500, message } = err;
  res.status(status).json({ message });
});

// TELEGRAM BOT
// const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_API}`;
// const URI = `/webhook/${TELEGRAM_BOT_API}`;
// const webhookURL = `${"https://hata-telegrambot.onrender.com"}${URI}`;

// const setupWebhook = async () => {
//   try {
//     const { data } = await axios.get(
//       `${TELEGRAM_API}/setWebhook?url=${webhookURL}&drop_pending_updates=true`
//     );
//     console.log(data);
//   } catch (error) {
//     return error;
//   }
// };
// const userCallbackData = {};
// bot.on("callback_query", async (ctx) => {
//   try {
//     const user = await userCtrl.getUserByChatId(ctx.message.chat.id);

//     if (ctx.data === "mainPage") {
//       await bot.sendMessage(
//         ctx.message.chat.id,
//         `Тут ви можете обрати інформацію яка вас цікавить.`,
//         {
//           reply_markup: {
//             inline_keyboard: [
//               [
//                 { text: "⚡️ Світло", callback_data: "electricPage" },
//                 { text: "📢 Новини", callback_data: "newsPage" },
//               ],

//               user.admin
//                 ? [
//                     { text: "👤 Моя інформація", callback_data: "personPage" },
//                     { text: "👥 Всі показники", callback_data: "allCounters" },
//                   ]
//                 : [{ text: "👤 Моя інформація", callback_data: "personPage" }],
//               [{ text: "🏪 На головну", callback_data: "mainPage" }],
//             ],
//             one_time_keyboard: true,
//           },
//         }
//       );
//     }
//     if (ctx.data === "allCounters") {
//       if (!user.admin) {
//         await bot.sendMessage(ctx.message.chat.id, "", {
//           reply_markup: {
//             inline_keyboard: [
//               [{ text: "🏪 На головну", callback_data: "mainPage" }],
//             ],
//           },
//         });
//       } else {
//         const allProperty = await propertyCtrl.getAllPropertyTelegram();
//         const sortedProperty = allProperty.sort((a, b) => {
//           const dateA = new Date(
//             a.electricData.date.split(".").reverse().join("-")
//           );
//           const dateB = new Date(
//             b.electricData.date.split(".").reverse().join("-")
//           );

//           return dateB - dateA;
//         });
//         await bot.sendMessage(
//           ctx.message.chat.id,
//           "<b>.................. Початок списку ..................</b>",
//           {
//             parse_mode: "HTML",
//           }
//         );

//         for (const prop of sortedProperty) {
//           const propertyUser = await userCtrl.getUserTelegramById(prop.ownerId);

//           await bot.sendMessage(
//             ctx.message.chat.id,
//             `Ім'я: ${propertyUser.name
//               .split(" ")
//               .slice(0, 2)
//               .join(" ")}\nПоказник: ${prop.electricData.current} | Дата: ${
//               prop.electricData.date
//             }\nДо оплати: ${prop.electricData.forPay}`
//           );
//         }

//         await bot.sendMessage(
//           ctx.message.chat.id,
//           " <b>.................. Кінець списку ..................</b> ",
//           {
//             parse_mode: "HTML",
//             reply_markup: {
//               inline_keyboard: [
//                 [{ text: "🏪 На головну", callback_data: "mainPage" }],
//               ],
//             },
//           }
//         );
//       }
//     }
//     if (ctx.data === "newsPage") {
//       await bot.sendMessage(ctx.message.chat.id, "Немає актуальних новин!", {
//         reply_markup: {
//           inline_keyboard: [
//             [{ text: "🏪 На головну", callback_data: "mainPage" }],
//           ],
//         },
//       });
//     }
//     if (ctx.data === "personPage") {
//       let message = `Імя: ${user.name}\nДілянки:`;

//       for (const [idx, id] of user.owned.entries()) {
//         const prop = await propertyCtrl.getPropertyTelegramById(id);

//         message += `\n\nДілянка №${prop.propertyNumber}\nПлоща: ${
//           prop.area
//         }\nКадастровий номер: ${prop.kadastrId}\nДата покупки: ${
//           prop.ownershipDate
//         }\nЕлектрика: ${
//           prop.hasElectic
//             ? `Наявна\nТариф: ${prop.electricTariff} грн.`
//             : `Відсутня`
//         }\n`;
//       }
//       await bot.sendMessage(ctx.message.chat.id, message, {
//         reply_markup: {
//           inline_keyboard: [
//             [{ text: "🏪 На головну", callback_data: "mainPage" }],
//           ],
//         },
//       });
//     }
//     if (ctx.data === "electricPage") {
//       const markup = [];
//       for (const [_, id] of user.owned.entries()) {
//         const { propertyNumber } = await propertyCtrl.getPropertyTelegramById(
//           id
//         );

//         markup.push({
//           text: `🏡 Ділянка №${propertyNumber}`,
//           callback_data: `properties ${id}`,
//         });
//       }
//       const newMarkUp = markUpInArray(markup);
//       await bot.sendMessage(
//         ctx.message.chat.id,
//         "Виберіть одну з доступних вам ділянок, для більш детальної інформації щодо електроенергії.",
//         {
//           reply_markup: {
//             inline_keyboard: [
//               ...newMarkUp,
//               [{ text: "🏪 На головну", callback_data: "mainPage" }],
//             ],
//           },
//         }
//       );
//     }
//     if (ctx.data.startsWith("properties")) {
//       const prop = await propertyCtrl.getPropertyTelegramById(
//         ctx.data.split(" ")[1]
//       );
//       if (!prop.hasElectic) {
//         throw new Error(
//           `У ділянки №${prop.propertyNumber} відсутнє підключення до світла.`
//         );
//       }

//       await bot.sendMessage(
//         ctx.message.chat.id,
//         `Ділянка номер ${prop.propertyNumber} покази лічильника ${
//           prop.electricData[0]
//             ? `станом на ${prop.electricData[0].date}: ${prop.electricData[0].current}`
//             : "відсутні"
//         }. Оберіть дію: `,
//         {
//           reply_markup: {
//             inline_keyboard: [
//               [
//                 {
//                   text: "📝 Подати показник",
//                   callback_data: `pokaz ${prop._id}`,
//                 },
//               ],
//               [{ text: "🏪 На головну", callback_data: "mainPage" }],
//             ],
//           },
//         }
//       );
//     }
//     if (ctx.data.startsWith("pokaz")) {
//       const propId = ctx.data.split(" ")[1];
//       const prop = await propertyCtrl.getPropertyTelegramById(propId);

//       const dateToday = formatDate();
//       if (prop.electricData.length > 0) {
//         if (
//           prop.electricData[0].date.split(".")[2] === dateToday.split(".")[2]
//         ) {
//           return await bot.sendMessage(
//             ctx.message.chat.id,
//             `Ви уже подавали показник цього місяця. \nАктуальний показник <u><i>${prop.electricData[0].current}</i></u> був поданий <u><i>${prop.electricData[0].date}</i></u>.\nПоказник можна буде подати з початку наступного місяця.  \nЯкщо ви допустили помилку, зверніться до <ins>правління кооперативу</ins>.`,
//             {
//               parse_mode: "HTML",
//               reply_markup: {
//                 inline_keyboard: [
//                   [{ text: "🏪 На головну", callback_data: "mainPage" }],
//                 ],
//               },
//             }
//           );
//         }
//       }
//       await bot.sendMessage(
//         ctx.message.chat.id,
//         "Подайте актуальний показник лічильника:",
//         {
//           reply_markup: {
//             inline_keyboard: [
//               [{ text: "🏪 На головну", callback_data: "mainPage" }],
//             ],
//           },
//         }
//       );
//       userCallbackData[ctx.message.chat.id] = {
//         propId,
//       };
//     }
//     const emptyKeyboard = { reply_markup: { inline_keyboard: [] } };

//     bot.editMessageReplyMarkup(emptyKeyboard, {
//       chat_id: ctx.message.chat.id,
//       message_id: ctx.message.message_id,
//     });
//   } catch (error) {
//     await bot.sendMessage(ctx.message.chat.id, error.message, {
//       reply_markup: {
//         inline_keyboard: [
//           [{ text: "🏪 На головну", callback_data: "mainPage" }],
//         ],
//       },
//     });
//   }
// });

// bot.on("text", async (msg) => {
//   try {
//     if (msg.text == "/start") {
//       await bot.sendMessage(
//         msg.chat.id,
//         `Для ідентифікація власника ділянки потрібно поділитись номером мобільного телефону.`,
//         {
//           reply_markup: {
//             keyboard: [
//               [{ text: "Поділитись номером телефону", request_contact: true }],
//             ],
//             one_time_keyboard: true,
//             is_persistent: true,
//             resize_keyboard: true,
//           },
//         }
//       );
//     } else if (msg.text == "/giveid") {
//       await bot.sendMessage(msg.chat.id, msg.chat.id);
//     } else if (userCallbackData[msg.chat.id]) {
//       const propertyId = userCallbackData[msg.chat.id].propId;
//       const prop = await propertyCtrl.getPropertyTelegramById(propertyId);
//       if (prop.electricData.length > 0) {
//         if (Number(msg.text) < prop.electricData[0].current) {
//           return await bot.sendMessage(
//             msg.chat.id,
//             "Показник повинен бути більшим за минулий. Впишіть коректний показник."
//           );
//         }
//       }

//       await propertyCtrl.addTelegramElecticData(propertyId, [
//         {
//           date: formatDate(),
//           current: Number(msg.text),
//           previous:
//             prop.electricData.length > 0 ? prop.electricData[0].current : 0,
//           forPay:
//             (Number(msg.text) -
//               ((prop.electricData[0] && prop.electricData[0].current) || 0)) *
//             prop.electricTariff,
//         },
//         ...prop.electricData,
//       ]);
//       await bot.sendMessage(
//         msg.chat.id,
//         `Показник ${msg.text} успішно поданий. До оплати: ${
//           (Number(msg.text) -
//             ((prop.electricData[0] && prop.electricData[0].current) || 0)) *
//           prop.electricTariff
//         } грн`,
//         {
//           reply_markup: {
//             inline_keyboard: [
//               [{ text: "🏪 На головну", callback_data: "mainPage" }],
//             ],
//           },
//         }
//       );

//       delete userCallbackData[msg.chat.id];
//     } else {
//       await bot.sendMessage(
//         msg.chat.id,
//         "Я вас не розумію. Виберіть пункт із меню:",
//         {
//           reply_markup: {
//             inline_keyboard: [
//               [{ text: "🏪 На головну", callback_data: "mainPage" }],
//             ],
//           },
//         }
//       );
//     }
//   } catch (error) {
//     console.log(error);
//   }
// });

// bot.on("contact", async (contact) => {
//   try {
//     const userPhone = contact.contact.phone_number.slice(2);
//     const findedUser = await userCtrl.addTelegramChatIdToUser(
//       userPhone,
//       contact.chat.id
//     );
//     await bot.sendMessage(
//       contact.chat.id,
//       `${findedUser.name} ідентифікація успішно завершена. \n\nТепер ви можете перейти на головну сторінку`,
//       {
//         reply_markup: {
//           inline_keyboard: [
//             [{ text: "🏪 На головну", callback_data: "mainPage" }],
//           ],
//         },
//       }
//     );
//   } catch (error) {
//     return await bot.sendMessage(
//       contact.chat.id,
//       "У доступі відмовлено. Ваш мобільний не знайдено в базі даних."
//     );
//   }
// });

// bot.on("polling_error", (err) => console.log(err.response.body));

module.exports = { app };
