import { Telegraf } from 'telegraf';
import http from 'http';

console.log('[SYSTEM]: Инициализация ядра SunLagom AI...');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_URL = process.env.RENDER_EXTERNAL_URL; // Render сам подставит свой адрес сюда

if (!BOT_TOKEN) {
    console.error('[CRITICAL ERROR]: TELEGRAM_BOT_TOKEN не найден!');
    process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

// --- Базовые команды ---
bot.start(async (ctx) => {
    await ctx.reply('⚡ Welcome to SunLagom AI Core! ⚡\n\nПривет! Бот успешно работает на серверах Render. Система готова к оптимизации контента!');
});

bot.on('text', async (ctx) => {
    const messageText = ctx.message.text;
    console.log(`[WEBHOOK_MSG]: Получено: "${messageText}"`);
    await ctx.reply(`SunLagom AI принял твой запрос: "${messageText}"`);
});

// --- Сервер для приема Webhook от Telegram ---
const PORT = process.env.PORT || 10000;
const server = http.createServer(async (req, res) => {
    if (req.method === 'POST' && req.url === `/bot${BOT_TOKEN}`) {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
            try {
                const update = JSON.parse(body);
                await bot.handleUpdate(update);
                res.writeHead(200);
                res.end(JSON.stringify({ ok: true }));
            } catch (err) {
                console.error('[WEBHOOK_ERROR]: Ошибка обработки:', err);
                res.writeHead(500);
                res.end();
            }
        });
    } else {
        res.writeHead(200);
        res.end('SunLagom AI Container: RUNNING PERFECTLY');
    }
});

// --- Запуск ---
server.listen(PORT, async () => {
    console.log(`[SYSTEM]: Сервер запущен на порту ${PORT}`);
    
    if (WEBHOOK_URL) {
        try {
            const webhookPath = `${WEBHOOK_URL}/bot${BOT_TOKEN}`;
            await bot.telegram.setWebhook(webhookPath);
            console.log(`[SYSTEM]: Webhook успешно установлен на: ${webhookPath}`);
        } catch (error) {
            console.error('[SYSTEM_ERROR]: Не удалось установить Webhook:', error);
        }
    } else {
        console.warn('[WARNING]: Переменная RENDER_EXTERNAL_URL не задана. Webhook не установлен.');
    }
});

// --- Обработка завершения ---
process.once('SIGINT', () => { 
    console.log('[SYSTEM]: Остановка бота...');
    process.exit(0); 
});
process.once('SIGTERM', () => { 
    console.log('[SYSTEM]: Остановка бота...');
    process.exit(0); 
});
