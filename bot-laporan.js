
import 'dotenv/config'; // Load .env
import TelegramBot from 'node-telegram-bot-api';
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

// --- CONFIG ---
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SPREADSHEET_ID = process.env.SPREADSHEET_ID || '1PvOheQ9IO8Xs6aBGAn96AxItQYyLmmkEk0kKgdsUkfk';
const SHEET_NAME = 'Laporan Langsung';
const KEY_FILE_PATH = path.join(process.cwd(), 'service-account.json');

// --- INIT ---
const bot = new TelegramBot(TOKEN, { polling: true });

// Auth Google Sheets
const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE_PATH,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth });

// --- STATE MANAGEMENT ---
const userState = {};

const STEPS = [
    {
        key: 'nama',
        question: 'Mohon bantuan untuk mengirimkan nama:',
        placeholder: 'NAMA PELANGGAN'
    },
    {
        key: 'alamat',
        question: 'Alamat:\n(bisa shareloc)',
        placeholder: 'ALAMAT / KLIK SHARE LOCATION',
        isLocation: true
    },
    {
        key: 'noInternet',
        question: 'No Internet (1311), Voice (022), IPTV (1311)',
        placeholder: 'NOMOR LAYANAN'
    },
    {
        key: 'keluhan',
        question: 'Kendala apa yang dialami ?',
        placeholder: 'KENDALA'
    },
    {
        key: 'layanan',
        question: 'Layanan:',
        placeholder: 'INTERNET / VOICE / IPTV'
    },
    {
        key: 'snOnt',
        question: 'Tuliskan SN ONT yang tertera di bawah perangkat \ncontoh : ZTEGCxxx , 485xxx , FHTTxxx',
        placeholder: 'SN ONT'
    },
    {
        key: 'pic',
        question: 'No PIC yang bisa dihubungi:',
        placeholder: 'NO HP/WA'
    }
];

// --- HANDLERS ---
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    userState[chatId] = { step: 0, data: {} };

    bot.sendMessage(chatId, 'Halo! Terimakasih telah menghubungi Laporan Langsung', {
        reply_markup: { remove_keyboard: true }
    }).then(() => {
        askQuestion(chatId, 0);
    });
});

function askQuestion(chatId, stepIndex) {
    const step = STEPS[stepIndex];
    const options = {
        parse_mode: 'Markdown'
    };

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

    bot.sendMessage(chatId, step.question, options);
}

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    const location = msg.location;

    if (text === '/start') return; // Handled by onText
    if (!userState[chatId]) return;

    const state = userState[chatId];
    const currentStepIndex = state.step;
    const currentStep = STEPS[currentStepIndex];

    // Handle Answer
    let answer = text;

    // Special handling for Location step
    if (currentStep.isLocation) {
        if (location) {
            answer = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
        } else if (!text) {
            // If neither text nor location, ignore
            return;
        }
    }

    // Save Answer
    state.data[currentStep.key] = answer;

    // Next Step
    if (currentStepIndex < STEPS.length - 1) {
        state.step++;
        askQuestion(chatId, state.step);
    } else {
        // FINISH
        await saveToSheet(chatId, state.data);
        delete userState[chatId];
    }
});

async function saveToSheet(chatId, data) {
    bot.sendMessage(chatId, 'Sedang menyimpan data...', { reply_markup: { remove_keyboard: true } });

    try {
        // Generate Ticket ID
        const ticketId = 'LAPSUNG-' + Math.floor(100000 + Math.random() * 900000);

        // Sheet Cols Mapping:
        // 0: Date, 1: Nama, 2: Alamat, 3: NoInternet, 4: Keluhan, 5: Layanan, 6: SN ONT, 7: PIC, 8: Status, 9: TicketID
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

        await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: `'${SHEET_NAME}'!A:A`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [row] }
        });

        const reportSummary = `
✅ *LAPORAN DITERIMA & DISIMPAN*

*No. Tiket:* ${ticketId}
*Nama:* ${data.nama}
*Alamat:* ${data.alamat}
*No Layanan:* ${data.noInternet}
*Kendala:* ${data.keluhan}
*Layanan:* ${data.layanan}
*SN ONT:* ${data.snOnt}
*PIC Contact:* ${data.pic}

Data telah masuk ke Dashboard. Terima kasih!
`.trim();

        bot.sendMessage(chatId, reportSummary, { parse_mode: 'Markdown' });
    } catch (error) {
        console.error('Error saving to sheet:', error);
        bot.sendMessage(chatId, `❌ Gagal menyimpan: ${error.message}`);
    }
}

console.log('Bot Laporan Langsung sedang berjalan...');
console.log('Tekan Ctrl+C untuk berhenti.');
