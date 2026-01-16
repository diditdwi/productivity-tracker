
import TelegramBot from 'node-telegram-bot-api';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { message } = req.body;
    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    const TOKEN = process.env.TELEGRAM_BOT_TOKEN; // Get from Vercel Env
    const GROUP_ID = '-1001374270728'; // Hardcoded Group ID

    if (!TOKEN) {
        return res.status(500).json({ error: 'Bot Token not configured' });
    }

    try {
        const bot = new TelegramBot(TOKEN, { polling: false }); // No polling for API
        await bot.sendMessage(GROUP_ID, message, { parse_mode: 'Markdown' });
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Telegram API Error:', error);
        res.status(500).json({ error: error.message });
    }
}
