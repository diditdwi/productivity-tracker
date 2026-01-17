
import TelegramBot from 'node-telegram-bot-api';
import { google } from 'googleapis';

// --- CONFIG ---
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SPREADSHEET_ID = process.env.SPREADSHEET_ID || '1PvOheQ9IO8Xs6aBGAn96AxItQYyLmmkEk0kKgdsUkfk';
const SHEET_NAME = 'Laporan Langsung';

// Decode Service Account from ENV variable (Base64 or JSON string) for Vercel
// Vercel doesn't allow file uploads easily, so we use ENV for credentials
const getAuth = () => {
    try {
        const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
        return new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });
    } catch (e) {
        console.error("Google Auth Error: Pastikan Env Var GOOGLE_SERVICE_ACCOUNT diisi dengan JSON service account.", e);
        return null;
    }
};

// --- INIT ---
const bot = new TelegramBot(TOKEN, { polling: false }); // Webhook mode (no polling)

// --- QUESTIONS ---
const STEPS = [
    { key: 'nama', question: 'Mohon bantuan untuk mengirimkan nama:', placeholder: 'NAMA PELANGGAN' },
    { key: 'alamat', question: 'Alamat:\n(bisa shareloc)', placeholder: 'ALAMAT / KLIK SHARE LOCATION', isLocation: true },
    { key: 'noInternet', question: 'No Internet (1311), Voice (022), IPTV (1311)', placeholder: 'NOMOR LAYANAN' },
    { key: 'keluhan', question: 'Kendala apa yang dialami ?', placeholder: 'KENDALA' },
    { key: 'layanan', question: 'Layanan:', placeholder: 'INTERNET / VOICE / IPTV' },
    { key: 'snOnt', question: 'Tuliskan SN ONT yang tertera di bawah perangkat \ncontoh : ZTEGCxxx , 485xxx , FHTTxxx', placeholder: 'SN ONT' },
    { key: 'pic', question: 'No PIC yang bisa dihubungi:', placeholder: 'NO HP/WA' }
];

// Helper: Ask Question
function getQuestionOptions(step) {
    const options = { parse_mode: 'Markdown' };
    if (step.isLocation) {
        options.reply_markup = {
            keyboard: [[{ text: '📍 Share Location', request_location: true }]],
            one_time_keyboard: true,
            resize_keyboard: true,
            input_field_placeholder: step.placeholder
        };
    } else {
        options.reply_markup = {
            force_reply: true,
            input_field_placeholder: step.placeholder
        };
    }
    return options;
}

// Helper: Save to Sheet
async function saveToSheet(chatId, data) {
    const auth = getAuth();
    if (!auth) return "❌ Gagal Autentikasi Google Sheet";

    const sheets = google.sheets({ version: 'v4', auth });
    const ticketId = 'LAPSUNG-' + Math.floor(100000 + Math.random() * 900000);

    const row = [
        new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
        data.nama,
        data.alamat,
        data.noInternet,
        data.keluhan,
        data.layanan,
        data.snOnt,
        data.pic,
        'Open',
        ticketId
    ];

    try {
        await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: `'${SHEET_NAME}'!A:A`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [row] }
        });
        return { success: true, ticketId };
    } catch (error) {
        console.error('Sheet Save Error:', error);
        return { success: false, error: error.message };
    }
}

// --- MAIN HANDLER (VERCEL FUNCTION) ---
// Since Vercel functions are stateless, we can't use simple in-memory 'userState' object reliably 
// if traffic is high or instances recycle. However, for a simple bot, we can use the 'Force Reply' technique 
// to pass state context, or just rely on Vercel's warm instance memory (best effort).
// For strict statelessness, we'd need a database (Redis/KV). 
// Here, we'll implement a logic where we try to infer context or simplify the flow.
// NOTE: For a multi-step form on Serverless without DB, 'Force Reply' is tricky because we lose the 'step' counter.
// PROPOSAL: We will use a simple in-memory cache but warn it might reset. Ideally, use Vercel KV.
// Let's implement a simplified in-memory map here. It works "most of the time" for low traffic.

const userState = new Map(); // Use Map for better performance

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(200).send('Telegram Bot Webhook is Active!');
    }

    const { body } = request;

    // Process update
    if (body.message) {
        const msg = body.message;
        const chatId = msg.chat.id;
        const text = msg.text;
        const location = msg.location;

        // COMMAND: /start
        if (text === '/start') {
            userState.set(chatId, { step: 0, data: {} });
            const step = STEPS[0];
            await bot.sendMessage(chatId, 'Halo! Terimakasih telah menghubungi Laporan Langsung', { reply_markup: { remove_keyboard: true } });
            await bot.sendMessage(chatId, step.question, getQuestionOptions(step));
            return response.status(200).send('OK');
        }

        // CHECK STATE
        if (!userState.has(chatId)) {
            // If user chats without /start, guide them
            await bot.sendMessage(chatId, 'Silakan ketik /start untuk memulai laporan.');
            return response.status(200).send('OK');
        }

        const state = userState.get(chatId);
        const currentStep = STEPS[state.step];

        // VALIDATE ANSWER
        let answer = text;
        let isValid = true;
        let errorMessage = '';

        if (currentStep.isLocation) {
            if (location) {
                answer = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
            } else if (text && text.trim() !== '') {
                answer = text;
            } else {
                isValid = false;
                errorMessage = '⚠️ Mohon kirim Lokasi (Share Location) atau ketik Alamat manual.';
            }
        } else {
            if (!text || text.trim() === '') {
                isValid = false;
                errorMessage = '⚠️ Bagian ini wajib diisi.';
            }
        }

        if (!isValid) {
            await bot.sendMessage(chatId, errorMessage);
            await bot.sendMessage(chatId, currentStep.question, getQuestionOptions(currentStep));
            return response.status(200).send('OK');
        }

        // SAVE DATA
        state.data[currentStep.key] = answer;

        // NEXT STEP
        if (state.step < STEPS.length - 1) {
            state.step++;
            const nextStep = STEPS[state.step];
            userState.set(chatId, state); // Update state
            await bot.sendMessage(chatId, nextStep.question, getQuestionOptions(nextStep));
        } else {
            // FINISH
            await bot.sendMessage(chatId, 'Sedang menyimpan data...', { reply_markup: { remove_keyboard: true } });
            const result = await saveToSheet(chatId, state.data);

            if (result.success) {
                const summary = `
✅ *LAPORAN DITERIMA & DISIMPAN*

*No. Tiket:* ${result.ticketId}
*Nama:* ${state.data.nama}
*Alamat:* ${state.data.alamat}
*No Layanan:* ${state.data.noInternet}
*Kendala:* ${state.data.keluhan}
*Layanan:* ${state.data.layanan}
*SN ONT:* ${state.data.snOnt}
*PIC Contact:* ${state.data.pic}

Data telah masuk ke Dashboard. Terima kasih!`.trim();
                await bot.sendMessage(chatId, summary, { parse_mode: 'Markdown' });
            } else {
                await bot.sendMessage(chatId, `❌ Gagal menyimpan: ${result.error}`);
            }

            userState.delete(chatId); // Clear session
        }
    }

    response.status(200).send('OK');
}
