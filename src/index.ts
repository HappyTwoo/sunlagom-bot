import { Telegraf } from 'telegraf';
import http from 'http';
import axios from 'axios';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API_KEY = process.env.OPENROUTER_API_KEY;
const PORT = process.env.PORT || 10000;
const RENDER_URL = process.env.RENDER_EXTERNAL_URL;

if (!BOT_TOKEN || !API_KEY) {
    console.error('КРИТИЧЕСКАЯ ОШИБКА: Отсутствуют переменные окружения BOT_TOKEN или API_KEY');
    process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

// Улучшенная функция запроса с подробным логированием ошибок
async function getAIResponse(userText: string) {
    try {
        console.log(`[AI] Запрос к OpenRouter: "${userText}"`);
        
        const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: 'google/gemini-flash-1.5-pro',
            messages: [{ role: 'user', content: userText }]
        }, {
            headers: { 
                'Authorization': `Bearer ${API_KEY}`,
                'HTTP-Referer': RENDER_URL || 'https://render.com', // Требуется OpenRouter
                'X-Title': 'SunLagom Bot' // Требуется OpenRouter
            }
        });

        return response.data.choices[0].message.content;
    } catch (error: any) {
        if (error.response) {
            console.error('[AI API ERROR]:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('[AI NETWORK ERROR]:', error.message);
        }
        return 'Прости, произошла ошибка при связи с мозгом нейросети. Проверь логи Render!';
    }
}

bot.on('text', async (ctx) => {
    const message = ctx.message.text;
    console.log(`[TG] Получено сообщение: ${message}`);
    const answer = await getAIResponse(message);
    await ctx.reply(answer);
});

const server = http.createServer(async (req, res) => {
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
        res.end('SunLagom AI is healthy');
    }
});

server.listen(PORT, async () => {
    console.log(`[SYSTEM] Сервер запущен на порту ${PORT}`);
    if (RENDER_URL) {
        const webhook = `${RENDER_URL}/bot${BOT_TOKEN}`;
        await bot.telegram.setWebhook(webhook);
        console.log(`[SYSTEM] Webhook установлен: ${webhook}`);
    }
});
