import { Telegraf } from 'telegraf';
import http from 'http';

console.log('[SYSTEM]: Перезапуск ядра SunLagom AI в режиме Webhook...');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!BOT_TOKEN) {
  console.error('[CRITICAL ERROR]: Токен отсутствует!');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

// Базовые команды
bot.start(async (ctx) => {
  await ctx.reply(`⚡ Welcome to SunLagom AI Core! ⚡\n\nПривет! Бот успешно работает через Webhook на серверах SunLagom. Система готова к оптимизации СЕС и контента!`);
});

bot.on('text', async (ctx) => {
  const messageText = ctx.message.text;
  console.log(`[WEBHOOK_MSG]: Получено: "${messageText}"`);
  await ctx.reply(`🎯 SunLagom AI принял твой запрос через защищенный канал!\n\nДанные: "${messageText}"`);
});

// Создаем один общий сервер и для Hugging Face, и для приема сообщений от Telegram
const TARGET_PORT = process.env.PORT || 7860;

// Твой уникальный адрес Спейса для вебхука
const SPACE_HOST = 'happytwo567-reels-bot.hf.space'; 

const server = http.createServer(async (req, res) => {
  // Если запрос пришел от Телеграма на секретный путь
  if (req.url === `/bot${BOT_TOKEN}`) {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const update = JSON.parse(body);
        await bot.handleUpdate(update);
      } catch (err) {
        console.error('[WEBHOOK_ERROR]: Ошибка обработки апдейта:', err);
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
    });
  } else {
    // Если это проверка от самого Hugging Face
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('SunLagom AI Container status: RUNNING PERFECTLY\n');
  }
});

server.listen(TARGET_PORT, async () => {
  console.log(`[SYSTEM]: Сервер поднят на порту ${TARGET_PORT}`);
  try {
    // Принудительно говорим Телеграму отправлять сообщения на наш Hugging Face
    await bot.telegram.setWebhook(`https://${SPACE_HOST}/bot${BOT_TOKEN}`);
    console.log('[SYSTEM]: Защищенный Webhook успешно зарегистрирован в Telegram!');
  } catch (error) {
    console.error('[SYSTEM_ERROR]: Не удалось установить Webhook:', error);
  }
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
