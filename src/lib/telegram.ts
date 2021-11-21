const TelegramBot = require('node-telegram-bot-api');
const token = process.env.TELEGRAM_BOT;

const bot = new TelegramBot(token, {polling: true});

bot.onText(/(.+)/, (msg: any, match: any) => {
  const chatId = msg.chat.id;
  const resp = match[1]; // the captured "whatever"
  bot.sendMessage(chatId, resp);
});

bot.on('message', (msg: any) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Someone is messaging');
});


const postTgAth = (athValue: string) => {
  bot.sendMessage(process.env.BOT_CHANNEL, '🦊 New Bitcoin *ATH* 💲' +  athValue + '💲 ![🚀🚀🚀🚀](https://i.ibb.co/wKbdk4P/rocket.gif)', { parse_mode : "MarkdownV2" });
}

export default postTgAth;