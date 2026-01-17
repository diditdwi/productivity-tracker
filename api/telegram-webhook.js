
import { google } from 'googleapis';

// --- CONFIG ---
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SPREADSHEET_ID = process.env.SPREADSHEET_ID || '1PvOheQ9IO8Xs6aBGAn96AxItQYyLmmkEk0kKgdsUkfk';
const SHEET_NAME = 'Laporan Langsung';

// Debug Log (In-Memory, resets on cold start)
let lastDebug = "No POST requests processed yet.";

// --- AUTH ---
const getAuth = () => {
    try {
        const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
        return new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });
    } catch (e) {
        return null;
    }
};

// --- TELEGRAM API HELPER ---
async function sendMessage(chatId, text, options = {}) {
    if (!TOKEN) return;
    const url = `https://api.telegram.org/bot${TOKEN}/sendMessage`;
    const payload = { chat_id: chatId, text, ...options };

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!data.ok) {
            lastDebug = `Telegram API Reject: ${data.description}`;
            console.error('Telegram Error:', data);
        }
    } catch (e) {
        lastDebug = `Fetch Failed: ${e.message}`;
        console.error('Fetch Error:', e);
    }
}

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

// --- GOOGLE SHEETS HELPER ---
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
        return { success: false, error: error.message };
    }
}

// --- STATE MANAGER ---
const userState = new Map();

// --- MAIN HANDLER ---
export default async function handler(request, response) {
    // DIAGNOSTIC GET
    if (request.method !== 'POST') {
        const tokenStatus = TOKEN ? 'Configured ✅' : 'MISSING ❌';
        return response.status(200).send(`
            <h1>Bot Status</h1>
            <p><strong>Token:</strong> ${tokenStatus}</p>
            <p><strong>Last Log:</strong> ${lastDebug}</p>
            <p>Time: ${new Date().toISOString()}</p>
        `);
    }

    try {
        let { body } = request;

        // Parsing Safe-guard
        if (typeof body === 'string') {
            try { body = JSON.parse(body); } catch (e) { lastDebug = "Body parse failed"; }
        }

        if (!body || !body.message) {
            lastDebug = "Received POST but no 'message' field found";
            return response.status(200).send('OK');
        }

        const msg = body.message;
        const chatId = msg.chat.id;
        const text = (msg.text || '').trim();
        const location = msg.location;

        lastDebug = `Processing msg from ${chatId}: ${text.substring(0, 20)}...`;

        // 1. COMMAND: /start
        if (text.toLowerCase().startsWith('/start')) {
            userState.set(chatId, { step: 0, data: {} });
            const step = STEPS[0];
            await sendMessage(chatId, 'Halo! Terimakasih telah menghubungi Laporan Langsung', { reply_markup: { remove_keyboard: true } });
            await sendMessage(chatId, step.question, getQuestionOptions(step));
            return response.status(200).send('OK');
        }

        // 2. CHECK STATE
        if (!userState.has(chatId)) {
            await sendMessage(chatId, 'Silakan ketik /start untuk memulai laporan.');
            return response.status(200).send('OK');
        }

        // 3. HANDLE STEPS
        const state = userState.get(chatId);
        const currentStep = STEPS[state.step];

        let answer = text;
        let isValid = true;
        let errorMessage = '';

        if (currentStep.isLocation) {
            if (location) {
                answer = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
            } else if (text && text !== '') {
                answer = text;
            } else {
                isValid = false;
                errorMessage = '⚠️ Mohon kirim Lokasi (Share Location) atau ketik Alamat manual.';
            }
        } else {
            if (!text || text === '') {
                isValid = false;
                errorMessage = '⚠️ Bagian ini wajib diisi.';
            }
        }

        if (!isValid) {
            await sendMessage(chatId, errorMessage);
            await sendMessage(chatId, currentStep.question, getQuestionOptions(currentStep));
            return response.status(200).send('OK');
        }

        // Save Answer
        state.data[currentStep.key] = answer;

        // Next Step or Finish
        if (state.step < STEPS.length - 1) {
            state.step++;
            const nextStep = STEPS[state.step];
            userState.set(chatId, state);
            await sendMessage(chatId, nextStep.question, getQuestionOptions(nextStep));
        } else {
            await sendMessage(chatId, 'Sedang menyimpan data...', { reply_markup: { remove_keyboard: true } });
            const result = await saveToSheet(chatId, state.data);

            if (result.success) {
                const summary = `
✅ *LAPORAN DITERIMA*
No. Tiket: ${result.ticketId}
Nama: ${state.data.nama}
Kendala: ${state.data.keluhan}

Terima kasih!`.trim();
                await sendMessage(chatId, summary, { parse_mode: 'Markdown' });
            } else {
                await sendMessage(chatId, `❌ Gagal menyimpan: ${result.error}`);
            }
            userState.delete(chatId);
        }

        response.status(200).send('OK');

    } catch (error) {
        lastDebug = `Handler Crash: ${error.message}`;
        console.error(error);
        response.status(500).send('Internal Error');
    }
}
