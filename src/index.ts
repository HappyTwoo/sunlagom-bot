import { Telegraf } from 'telegraf';
import http from 'http';
import axios from 'axios';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API_KEY = process.env.OPENROUTER_API_KEY;
const PORT = process.env.PORT || 10000;
const RENDER_URL = process.env.RENDER_EXTERNAL_URL;

const bot = new Telegraf(BOT_TOKEN!);

// Функция запроса к нейросети
async function getAIResponse(userText: string) {
    try {
        const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: 'google/gemini-flash-1.5-pro', // или выбери другую модель
            messages: [{ role: 'user', content: userText }]
        }, {
            headers: { 'Authorization': `Bearer ${API_KEY}` }
        });
        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('AI Error:', error);
        return 'Прости, я сейчас немного приболел, попробуй позже.';
    }
}

bot.on('text', async (ctx) => {
    const answer = await getAIResponse(ctx.message.text);
    await ctx.reply(answer);
});

// Сервер для Webhook
const server = http.createServer(async (req, res) => {
    if (req.method === 'POST' && req.url === `/bot${BOT_TOKEN}`) {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
            await bot.handleUpdate(JSON.parse(body));
            res.writeHead(200);
            res.end();
        });
    } else {
        res.end('AI Bot is running');
    }
});

server.listen(PORT, async () => {
    if (RENDER_URL) {
        await bot.telegram.setWebhook(`${RENDER_URL}/bot${BOT_TOKEN}`);
    }
});
