import { Telegraf } from 'telegraf';
import http from 'http';

// 1. Инициализация
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const PORT = process.env.PORT || 10000;
const RENDER_URL = process.env.RENDER_EXTERNAL_URL;

if (!BOT_TOKEN) {
    console.error('Ошибка: TELEGRAM_BOT_TOKEN не задан!');
    process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

// 2. Команды бота
bot.start((ctx) => ctx.reply('Бот запущен и готов к работе!'));
bot.on('text', (ctx) => ctx.reply(`Ты написал: ${ctx.message.text}`));

// 3. Сервер для Webhook
const server = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === `/bot${BOT_TOKEN}`) {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
            try {
                await bot.handleUpdate(JSON.parse(body));
                res.writeHead(200);
                res.end();
            } catch (e) {
                res.writeHead(500);
                res.end();
            }
        });
    } else {
        res.writeHead(200);
        res.end('Bot is running');
    }
});

// 4. Запуск
server.listen(PORT, async () => {
    console.log(`Сервер слушает порт ${PORT}`);
    
    // Автоматическая установка Webhook
    if (RENDER_URL) {
        const url = `${RENDER_URL}/bot${BOT_TOKEN}`;
        await bot.telegram.setWebhook(url);
        console.log(`Webhook установлен на ${url}`);
    }
});
