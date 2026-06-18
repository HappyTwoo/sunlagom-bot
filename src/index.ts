import { Telegraf } from 'telegraf';
import http from 'http';
import axios from 'axios';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API_KEY = process.env.OPENROUTER_API_KEY;
const PORT = process.env.PORT || 10000;
const RENDER_URL = process.env.RENDER_EXTERNAL_URL;

if (!BOT_TOKEN || !API_KEY) {
    console.error('КРИТИЧЕСКАЯ ОШИБКА: Проверь переменные окружения в Render!');
    process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

async function getAIResponse(userText: string) {
    try {
        const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: 'mistralai/mistral-7b-instruct',
            messages: [{ role: 'user', content: userText }]
        }, {
            headers: { 
                'Authorization': `Bearer ${API_KEY}`,
                'HTTP-Referer': RENDER_URL || 'https://render.com',
                'X-Title': 'SunLagom Bot'
            }
        });
        return response.data.choices[0].message.content;
    } catch (error: any) {
        console.error('[AI ERROR]:', error.response?.data || error.message);
        return 'Нейросеть сейчас недоступна. Проверь логи API-ключа.';
    }
}

bot.on('text', async (ctx) => {
    const answer = await getAIResponse(ctx.message.text);
    await ctx.reply(answer);
});

const server = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === `/bot${BOT_TOKEN}`) {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
            await bot.handleUpdate(JSON.parse(body));
            res.writeHead(200);
            res.end();
        });
    } else {
        res.writeHead(200);
        res.end('SunLagom AI Bot is live');
    }
});

server.listen(PORT, async () => {
    if (RENDER_URL) {
        await bot.telegram.setWebhook(`${RENDER_URL}/bot${BOT_TOKEN}`);
        console.log(`Webhook установлен на ${RENDER_URL}`);
    }
});
