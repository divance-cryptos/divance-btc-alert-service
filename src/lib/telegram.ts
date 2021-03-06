
const TelegramBot = require('node-telegram-bot-api');
const token = process.env.TELEGRAM_BOT;
console.log('bot token: ', token);
const bot = new TelegramBot(token, {polling: true});

// bot.onText(/(.+)/, (msg: any, match: any) => {
//   const chatId = msg.chat.id;
//   const resp = match[1]; // the captured "whatever"
//   bot.sendMessage(chatId, resp);
// });

// bot.on('message', (msg: any) => {
//   const chatId = msg.chat.id;
//   bot.sendMessage(chatId, 'Someone is messaging');
// });


const postTgAth = (athValue: string, symbol: string) => {
  console.log(athValue);
  const bodyMessage = `🦊 New ${symbol} *ATH* 💲` +  athValue + '💲 ![🚀🚀🚀🚀](https://i.ibb.co/wKbdk4P/rocket.gif)' + ' ' + new Date().toDateString();
  console.log(bodyMessage)
  bot.sendMessage(process.env.BOT_CHANNEL, bodyMessage, { parse_mode : "Markdown" });
}

export default postTgAth;
