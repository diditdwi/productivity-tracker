import express from 'express';
import cors from 'cors';
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import makeWASocket, { DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import qrcode from 'qrcode-terminal';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// --- GLOBAL STATE ---
let sock = null;
let isWaReady = false;
const userChats = new Map();

// --- GOOGLE SHEETS SETUP ---
const KEY_FILE_PATH = path.join(process.cwd(), 'service-account.json');
const SHEET_ID_LAPORAN = '1PvOheQ9IO8Xs6aBGAn96AxItQYyLmmkEk0kKgdsUkfk';

const getSheetsClient = () => {
    const auth = new google.auth.GoogleAuth({
        keyFile: KEY_FILE_PATH,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    return google.sheets({ version: 'v4', auth });
};

function generateTicketId() {
    const now = new Date();
    const d = String(now.getDate()).padStart(2, '0');
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const y = String(now.getFullYear()).slice(-2);
    const random = Math.floor(1000 + Math.random() * 9000);
    return `TICK-${d}${m}${y}-${random}`;
}

async function saveReportToSheet(data) {
    try {
        const sheets = getSheetsClient();
        const ticketId = generateTicketId();
        const timestamp = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
        const row = [
            timestamp,
            data.nama || '-',
            data.alamat || '-',
            data.noInternet || '-',
            data.keluhan || '-',
            data.layanan || '-',
            data.snOnt || '-',
            data.pic || '-',
            'Open',
            ticketId
        ];

        await sheets.spreadsheets.values.append({
            spreadsheetId: SHEET_ID_LAPORAN,
            range: "'Laporan Langsung'!A:A",
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [row] }
        });
        return ticketId;
    } catch (error) {
        console.error('Error saving to sheet:', error);
        return null;
    }
}

// --- WHATSAPP BAILEYS SETUP ---
async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: state,
        getMessage: async (key) => {
            return { conversation: '' };
        }
    });

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log('\nWHATSAPP QR CODE:');
            qrcode.generate(qr, { small: true });
            console.log('\nPlease scan the QR code with WhatsApp to log in.\n');
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error instanceof Boom)
                ? lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut
                : true;

            console.log('Connection closed. Reconnecting:', shouldReconnect);
            isWaReady = false;

            if (shouldReconnect) {
                setTimeout(() => connectToWhatsApp(), 3000);
            }
        } else if (connection === 'open') {
            console.log('WhatsApp Client is ready!');
            isWaReady = true;
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;

        for (const msg of messages) {
            if (!msg.message) continue;
            if (msg.key.fromMe) continue;

            const chatId = msg.key.remoteJid;
            const messageText = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
            const body = messageText.trim();
            const text = body.toUpperCase();

            console.log('Received message:', body, 'from', chatId);

            try {
                // 0. RESET/CANCEL COMMAND
                if (text === 'BATAL' || text === 'RESET' || text === 'CANCEL') {
                    if (userChats.has(chatId)) {
                        userChats.delete(chatId);
                        await sock.sendMessage(chatId, { text: '🚫 Laporan dibatalkan. Ketik *LAPOR* untuk mulai dari awal.' });
                    } else {
                        await sock.sendMessage(chatId, { text: 'Tidak ada sesi laporan yang aktif.' });
                    }
                    continue;
                }

                // 1. HANDLE ACTIVE CONVERSATION STATE
                if (userChats.has(chatId)) {
                    const state = userChats.get(chatId);

                    switch (state.step) {
                        case 'WAIT_NAME':
                            state.data.nama = body;
                            state.step = 'WAIT_ADDRESS';
                            await sock.sendMessage(chatId, { text: '2. Masukkan *ALAMAT LENGKAP*:' });
                            break;

                        case 'WAIT_ADDRESS':
                            state.data.alamat = body;
                            state.step = 'WAIT_NO_INET';
                            await sock.sendMessage(chatId, { text: '3. Masukkan *NO LAYANAN / INTERNET*:' });
                            break;

                        case 'WAIT_NO_INET':
                            state.data.noInternet = body;
                            state.step = 'WAIT_COMPLAINT';
                            await sock.sendMessage(chatId, { text: '4. Masukkan *KELUHAN / KENDALA*:' });
                            break;

                        case 'WAIT_COMPLAINT':
                            state.data.keluhan = body;
                            state.step = 'WAIT_SERVICE';
                            await sock.sendMessage(chatId, { text: '5. Jenis Layanan (Contoh: Internet/Voice/IPTV/Datin):' });
                            break;

                        case 'WAIT_SERVICE':
                            state.data.layanan = body;
                            state.step = 'WAIT_SN';
                            await sock.sendMessage(chatId, { text: '6. Masukkan *SN ONT* (Jika ada, atau ketik -):' });
                            break;

                        case 'WAIT_SN':
                            state.data.snOnt = body;
                            state.step = 'WAIT_PIC';
                            await sock.sendMessage(chatId, { text: '7. Masukkan *NO HP / CP PIC* yang bisa dihubungi:' });
                            break;

                        case 'WAIT_PIC':
                            state.data.pic = body;
                            userChats.delete(chatId);

                            await sock.sendMessage(chatId, { text: '⏳ Sedang menyimpan data...' });
                            const ticketId = await saveReportToSheet(state.data);
                            if (ticketId) {
                                await sock.sendMessage(chatId, {
                                    text: `✅ *LAPORAN DITERIMA & DISIMPAN*\n\nNo. Tiket: ${ticketId}\nNama: ${state.data.nama}\nAlamat: ${state.data.alamat}\nNo Layanan: ${state.data.noInternet}\nKendala: ${state.data.keluhan}\nLayanan: ${state.data.layanan}\nSN ONT: ${state.data.snOnt}\nPIC Contact: ${state.data.pic}\n\nData telah masuk ke Dashboard. Terima kasih!`
                                });
                            } else {
                                await sock.sendMessage(chatId, { text: '❌ Maaf, terjadi kesalahan saat menyimpan laporan.' });
                            }
                            break;
                    }
                    continue;
                }

                // 2. ONE-SHOT COMMAND
                if ((text.startsWith('LAPOR') || text.startsWith('ORDER')) && body.includes('\n')) {
                    console.log('Received One-Shot Report via WA:', body);

                    const lines = body.split('\n');
                    const data = {};

                    lines.forEach(line => {
                        const parts = line.split(':');
                        if (parts.length < 2) return;

                        const key = parts[0].trim().toLowerCase();
                        const value = parts.slice(1).join(':').trim();

                        if (key.includes('nama')) data.nama = value;
                        else if (key.includes('alamat')) data.alamat = value;
                        else if (key.includes('internet') || key.includes('inet')) data.noInternet = value;
                        else if (key.includes('keluhan') || key.includes('kendala')) data.keluhan = value;
                        else if (key.includes('layanan')) data.layanan = value;
                        else if (key.includes('sn')) data.snOnt = value;
                        else if (key.includes('pic') || key.includes('cp')) data.pic = value;
                    });

                    if (!data.nama && !data.keluhan) {
                        await sock.sendMessage(chatId, { text: 'Format tidak terbaca. Gunakan fitur *LAPOR* interaktif (tanpa enter) atau perbaiki format.' });
                        continue;
                    }

                    const ticketId = await saveReportToSheet(data);
                    if (ticketId) {
                        await sock.sendMessage(chatId, { text: `✅ *LAPORAN DITERIMA*\nTicket: ${ticketId}\nTerima kasih!` });
                    } else {
                        await sock.sendMessage(chatId, { text: '❌ Gagal menyimpan laporan.' });
                    }
                    continue;
                }

                // 3. START INTERACTIVE MODE
                if (text === 'LAPOR' || text === 'ORDER') {
                    userChats.set(chatId, { step: 'WAIT_NAME', data: {} });
                    await sock.sendMessage(chatId, {
                        text: '🤖 *MODE LAPORAN INTERAKTIF*\n\nSiap membantu mencatat laporan.\nSilakan jawab pertanyaan berikut satu per satu.\n(Ketik *BATAL* untuk berhenti kapan saja)\n\n1. Masukkan *NAMA PELANGGAN*:'
                    });
                    continue;
                }

                // Handle General Commands
                if (text === '/START' || text === 'MENU' || text === 'HELP' || text === 'HALO' || text === 'PING' || text === 'TEST') {
                    const welcomeMsg = `🤖 *Hellow, I am Ticket Bot!*\n\nKetik *LAPOR* untuk memulai pelaporan gangguan secara bertahap.\n\nAtau gunakan format langsung:\n*LAPOR*\nNama: ...\nAlamat: ...\n(dst)`;
                    await sock.sendMessage(chatId, { text: welcomeMsg });
                }
            } catch (error) {
                console.error('Error handling message:', error);
            }
        }
    });
}

// --- API ENDPOINTS ---
app.get('/api/laporan-langsung', async (req, res) => {
    try {
        const sheets = getSheetsClient();
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID_LAPORAN,
            range: "'Laporan Langsung'!A:Z",
        });

        const rows = response.data.values || [];
        let dataRows = rows;
        if (rows.length > 0) {
            const firstRow = rows[0];
            const isHeader = firstRow[0] && (firstRow[0].toLowerCase().includes('timestamp') || firstRow[0].toLowerCase().includes('waktu'));
            if (isHeader) {
                dataRows = rows.slice(1);
            }
        }

        const data = dataRows.map((row, idx) => ({
            id: idx,
            timestamp: row[0] || '-',
            nama: row[1] || '-',
            alamat: row[2] || '-',
            noInternet: row[3] || '-',
            keluhan: row[4] || '-',
            layanan: row[5] || '-',
            snOnt: row[6] || '-',
            pic: row[7] || '-',
            status: row[8] || 'Open',
            ticketId: row[9] || '-'
        })).reverse();

        res.json(data);
    } catch (error) {
        console.error('Error fetching Laporan Langsung:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/wa-status', (req, res) => {
    res.json({ ready: isWaReady });
});

// Send WhatsApp Message API (for frontend notifications)
app.post('/api/send-whatsapp', async (req, res) => {
    console.log('📨 WhatsApp send request received. WA Ready:', isWaReady);

    if (!isWaReady) {
        console.log('❌ WhatsApp client not ready');
        return res.status(503).json({ error: 'WhatsApp not ready yet' });
    }

    const { message, groupId } = req.body;
    console.log('📱 Attempting to send to:', groupId);

    if (!message || !groupId) {
        return res.status(400).json({ error: 'Missing message or groupId' });
    }

    try {
        console.log('📤 Sending WhatsApp message...');
        await sock.sendMessage(groupId, { text: message });
        console.log('✅ WhatsApp message sent successfully to:', groupId);
        res.json({ success: true, message: 'Message sent successfully' });
    } catch (e) {
        console.error('❌ Send WA Error:', e);
        res.status(500).json({ error: e.message });
    }
});

// Health Check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'WhatsApp Service (Baileys)',
        whatsappReady: isWaReady,
        features: ['send-notification', 'receive-lapor'],
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    connectToWhatsApp().catch(err => console.error('WhatsApp connection error:', err));
});
