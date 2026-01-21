const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');

// MONKEY PATCH: Disable sendSeen to prevent crash on new WA Web versions
// The 'markedUnread' error happens because WA removed an internal model property.
// By disabling sendSeen (blue tick), we bypass the code that checks this property.
Client.prototype.sendSeen = async function (chatId) {
    // console.log('🛑 Read receipt (sendSeen) disabled to prevent crash.');
    return true;
};

const qrcode = require('qrcode-terminal');
const cors = require('cors');
const { google } = require('googleapis');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// WhatsApp Client Setup
let isWaReady = false;
const waClient = new Client({
    authStrategy: new LocalAuth({
        dataPath: './wa-session'
    }),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ]
    }
});

// ==================== GOOGLE SHEETS SETUP ====================
const KEY_FILE_PATH = path.join(process.cwd(), '../service-account.json');
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

// ==================== WHATSAPP BOT INTERAKTIF ====================
const userChats = new Map();

waClient.on('message_create', async msg => {
    if (msg.fromMe) return;

    const chatId = msg.from;
    const body = msg.body.trim();
    const text = body.toUpperCase();

    // RESET/CANCEL COMMAND
    if (text === 'BATAL' || text === 'RESET' || text === 'CANCEL') {
        if (userChats.has(chatId)) {
            userChats.delete(chatId);
            await waClient.sendMessage(chatId, '🚫 Laporan dibatalkan. Ketik *LAPOR* untuk mulai dari awal.');
        } else {
            await waClient.sendMessage(chatId, 'Tidak ada sesi laporan yang aktif.');
        }
        return;
    }

    // HANDLE ACTIVE CONVERSATION STATE
    if (userChats.has(chatId)) {
        const state = userChats.get(chatId);

        switch (state.step) {
            case 'WAIT_NAME':
                state.data.nama = body;
                state.step = 'WAIT_ADDRESS';
                await waClient.sendMessage(chatId, '2. Masukkan *ALAMAT LENGKAP*:');
                break;

            case 'WAIT_ADDRESS':
                state.data.alamat = body;
                state.step = 'WAIT_NO_INET';
                await waClient.sendMessage(chatId, '3. Masukkan *NO LAYANAN / INTERNET*:');
                break;

            case 'WAIT_NO_INET':
                state.data.noInternet = body;
                state.step = 'WAIT_COMPLAINT';
                await waClient.sendMessage(chatId, '4. Masukkan *KELUHAN / KENDALA*:');
                break;

            case 'WAIT_COMPLAINT':
                state.data.keluhan = body;
                state.step = 'WAIT_SERVICE';
                await waClient.sendMessage(chatId, '5. Jenis Layanan (Contoh: Internet/Voice/IPTV/Datin):');
                break;

            case 'WAIT_SERVICE':
                state.data.layanan = body;
                state.step = 'WAIT_SN';
                await waClient.sendMessage(chatId, '6. Masukkan *SN ONT* (Jika ada, atau ketik -):');
                break;

            case 'WAIT_SN':
                state.data.snOnt = body;
                state.step = 'WAIT_PIC';
                await waClient.sendMessage(chatId, '7. Masukkan *NO HP / CP PIC* yang bisa dihubungi:');
                break;

            case 'WAIT_PIC':
                state.data.pic = body;
                userChats.delete(chatId);

                await waClient.sendMessage(chatId, '⏳ Sedang menyimpan data...');
                const ticketId = await saveReportToSheet(state.data);
                if (ticketId) {
                    await waClient.sendMessage(chatId, `✅ *LAPORAN DITERIMA & DISIMPAN*\n\nNo. Tiket: ${ticketId}\nNama: ${state.data.nama}\nAlamat: ${state.data.alamat}\nNo Layanan: ${state.data.noInternet}\nKendala: ${state.data.keluhan}\nLayanan: ${state.data.layanan}\nSN ONT: ${state.data.snOnt}\nPIC Contact: ${state.data.pic}\n\nData telah masuk ke Dashboard. Terima kasih!`);
                } else {
                    await waClient.sendMessage(chatId, '❌ Maaf, terjadi kesalahan saat menyimpan laporan.');
                }
                break;
        }
        return;
    }

    // ONE-SHOT COMMAND (Legacy Support)
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
            await waClient.sendMessage(chatId, 'Format tidak terbaca. Gunakan fitur *LAPOR* interaktif (tanpa enter) atau perbaiki format.');
            return;
        }

        const ticketId = await saveReportToSheet(data);
        if (ticketId) {
            await waClient.sendMessage(chatId, `✅ *LAPORAN DITERIMA*\nTicket: ${ticketId}\nTerima kasih!`);
        } else {
            await waClient.sendMessage(chatId, '❌ Gagal menyimpan laporan.');
        }
        return;
    }

    // START INTERACTIVE MODE
    if (text === 'LAPOR' || text === 'ORDER') {
        userChats.set(chatId, { step: 'WAIT_NAME', data: {} });
        await waClient.sendMessage(chatId, '🤖 *MODE LAPORAN INTERAKTIF*\n\nSiap membantu mencatat laporan.\nSilakan jawab pertanyaan berikut satu per satu.\n(Ketik *BATAL* untuk berhenti kapan saja)\n\n1. Masukkan *NAMA PELANGGAN*:');
        return;
    }

    // Handle General Commands / Greetings
    if (text === '/START' || text === 'MENU' || text === 'HELP' || text === 'HALO' || text === 'PING' || text === 'TEST' || text === 'SELAMAT PAGI' || text === 'SELAMAT SIANG' || text === 'SELAMAT SORE' || text === 'SELAMAT MALAM') {
        const welcomeMsg = `🤖 *Hellow, I am Ticket Bot!*\n\nKetik *LAPOR* untuk memulai pelaporan gangguan secara bertahap.\n\nAtau gunakan format langsung:\n*LAPOR*\nNama: ...\nAlamat: ...\n(dst)`;
        await waClient.sendMessage(chatId, welcomeMsg);
    }
});

// ==================== WHATSAPP EVENTS ====================
waClient.on('qr', (qr) => {
    console.log('\n========================================');
    console.log('WHATSAPP QR CODE:');
    console.log('========================================\n');
    qrcode.generate(qr, { small: true });
    console.log('\n========================================');
    console.log('Scan QR code above with WhatsApp');
    console.log('========================================\n');
});

waClient.on('ready', () => {
    console.log('✅ WhatsApp Client is READY!');
    isWaReady = true;
});

waClient.on('authenticated', () => {
    console.log('✅ WhatsApp Authenticated');
});

waClient.on('auth_failure', (msg) => {
    console.error('❌ WhatsApp Auth Failure:', msg);
    isWaReady = false;
});

waClient.on('disconnected', (reason) => {
    console.log('⚠️ WhatsApp Disconnected:', reason);
    isWaReady = false;
});

// Initialize WhatsApp Client
console.log('🚀 Initializing WhatsApp Client...');
waClient.initialize();

// ==================== API ENDPOINTS ====================

// Health Check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'WhatsApp Service (Merged)',
        whatsappReady: isWaReady,
        features: ['send-notification', 'receive-lapor'],
        timestamp: new Date().toISOString()
    });
});

// WhatsApp Status
app.get('/api/wa-status', (req, res) => {
    res.json({
        ready: isWaReady,
        message: isWaReady ? 'WhatsApp client is ready' : 'WhatsApp client not ready'
    });
});

// Get WhatsApp Groups
app.get('/api/wa-groups', async (req, res) => {
    if (!isWaReady) {
        return res.status(503).json({ error: 'WhatsApp not ready yet' });
    }

    try {
        const chats = await waClient.getChats();
        const groups = chats
            .filter(c => c.isGroup)
            .map(c => ({ id: c.id._serialized, name: c.name }));
        res.json(groups);
    } catch (e) {
        console.error('Error getting groups:', e);
        res.status(500).json({ error: e.message });
    }
});

// Send WhatsApp Message
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
        await waClient.sendMessage(groupId, message);
        console.log('✅ WhatsApp message sent successfully to:', groupId);
        res.json({ success: true, message: 'Message sent successfully' });
    } catch (e) {
        console.error('❌ Send WA Error:', e);
        res.status(500).json({ error: e.message });
    }
});

// Error handling
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start Server
app.listen(PORT, () => {
    console.log('\n========================================');
    console.log(`🚀 WhatsApp Service (Merged) running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
    console.log(`📊 Status: http://localhost:${PORT}/api/wa-status`);
    console.log(`🤖 Bot Features: Send Notification + Receive LAPOR`);
    console.log('========================================\n');
});
