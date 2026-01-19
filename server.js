import express from 'express';
import cors from 'cors';
import puppeteer from 'puppeteer';
import * as OTPAuth from 'otpauth';
import https from 'https';
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode-terminal';

const app = express();
const PORT = 3001;

// --- CONFIGURATION ---
const LOGIN_URL = 'https://oss-incident.telkom.co.id/jw/web/userview/ticketIncidentService/ticketIncidentService/_/welcome';
const USERNAME = ''; // Removed for security
const PASSWORD = ''; // Removed for security
const SECRET_STRING = ''; // Removed for security
const SECRET = SECRET_STRING.split('&')[0];

// --- GLOBAL STATE ---
let browser = null;
let page = null;
let isSessionActive = false;
let isLoggingIn = false;

// --- WHATSAPP CLIENT ---
console.log('Initializing WhatsApp Client...');
const waClient = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true, // Run in background
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

let isWaReady = false;

waClient.on('qr', (qr) => {
    console.log('WHATSAPP QR CODE RECEIVED:');
    qrcode.generate(qr, { small: true });
    console.log('Please scan the QR code with WhatsApp to log in.');
});

waClient.on('ready', () => {
    console.log('WhatsApp Client is ready!');
    isWaReady = true;
});

waClient.on('auth_failure', msg => {
    console.error('WhatsApp Auth Failure:', msg);
});

waClient.on('disconnected', (reason) => {
    console.log('WhatsApp Disconnected:', reason);
    isWaReady = false;
});

waClient.initialize();

app.use(cors());
app.use(express.json());

// --- HELPERS ---
function getNetworkTime() {
    return new Promise((resolve) => {
        const req = https.request('https://insera-sso.telkom.co.id/jw/web/login', { method: 'HEAD' }, (res) => {
            if (res.headers['date']) resolve(new Date(res.headers['date']).getTime());
            else resolve(Date.now());
        });
        req.on('error', () => resolve(Date.now()));
        req.end();
    });
}

async function initBrowserAndLogin() {
    console.log('Login functionality is currently DISABLED.');
    return; // Disabled by user request

    if (isLoggingIn || isSessionActive) return;
    isLoggingIn = true;
    console.log('Initializing Browser Session...');

    try {
        if (!browser) {
            browser = await puppeteer.launch({
                headless: false, // VISIBLE for debugging
                defaultViewport: null,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            page = await browser.newPage();
        }

        console.log('Navigating to login...');
        await page.goto(LOGIN_URL, { waitUntil: 'networkidle0' });

        if (page.url().includes('/jw/setup')) {
            const client = await page.target().createCDPSession();
            await client.send('Network.clearBrowserCookies');
            await client.send('Network.clearBrowserCache');
            await page.goto(LOGIN_URL, { waitUntil: 'networkidle0' });
        }

        try {
            if (await page.$('#j_username')) {
                await page.type('#j_username', USERNAME);
                await page.type('#j_password', PASSWORD);
                const ssoBtn = await page.$('#openIDLogin');
                if (ssoBtn) await ssoBtn.click();
                else await page.click('input[type="submit"]');
                try { await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 5000 }); } catch (e) { }
            }
        } catch (e) { }

        let currentUrl = page.url();

        if (currentUrl.includes('JwtSsoWebService')) {
            await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded' });
        }

        if (page.url().includes('insera-sso')) {
            await page.waitForSelector('#fake-username');
            await page.evaluate((u, p) => {
                const uField = document.querySelector('#j_username') || document.querySelector('input[name="j_username"]');
                const pField = document.querySelector('#j_password') || document.querySelector('input[name="j_password"]');
                if (uField) uField.value = u;
                if (pField) pField.value = p;
            }, USERNAME, PASSWORD);

            await page.type('#fake-username', USERNAME);
            await page.type('#fake-password', PASSWORD);
            try {
                await page.evaluate(() => {
                    const cb = document.querySelector('#acceptTerms');
                    if (cb && !cb.checked) cb.click();
                });
            } catch (e) { }
            await page.click('#fake-login');
            try { await page.waitForNavigation({ waitUntil: 'networkidle0' }); } catch (e) { }
        }

        const otpFrameElement = await page.$('#jqueryDialogFrame');
        if (otpFrameElement) {
            console.log('Generating OTP...');
            const totp = new OTPAuth.TOTP({
                issuer: 'insera-sso.telkom.co.id',
                label: USERNAME,
                algorithm: 'SHA1',
                digits: 6,
                period: 30,
                secret: OTPAuth.Secret.fromBase32(SECRET)
            });
            const serverTime = await getNetworkTime();
            const token = totp.generate({ timestamp: serverTime });

            const otpFrame = await otpFrameElement.contentFrame();
            await otpFrame.type('#pin', token);
            await otpFrame.click('.form-button');
            await page.waitForNavigation({ waitUntil: 'networkidle0' });
        }

        console.log('Login Successful. Session Active.');
        isSessionActive = true;

    } catch (e) {
        console.error('Login Failed:', e);
        if (browser) await browser.close();
        browser = null;
    } finally {
        isLoggingIn = false;
    }
}

// --- API ENDPOINTS ---

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
        const ticketId = generateTicketId(); // Generate ID
        // Columns: Timestamp, Nama, Alamat, No Internet, Keluhan, Layanan, SN ONT, PIC, Status, TicketId
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
            ticketId // Save Generated ID
        ];

        await sheets.spreadsheets.values.append({
            spreadsheetId: SHEET_ID_LAPORAN,
            range: "'Laporan Langsung'!A:A",
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [row] }
        });
        return ticketId; // Return the ID
    } catch (error) {
        console.error('Error saving to sheet:', error);
        return null;
    }
}

// WhatsApp Message Handler
waClient.on('message_create', async msg => {
    const body = msg.body;
    // Check keyword
    const text = body.trim().toUpperCase();

    if (text.startsWith('LAPOR') || text.startsWith('ORDER')) {
        console.log('Received Report via WA:', body);

        // Simple Parsing Logic
        const lines = body.split('\n');
        const data = {};

        lines.forEach(line => {
            const parts = line.split(':');
            if (parts.length < 2) return;

            const key = parts[0].trim().toLowerCase();
            const value = parts.slice(1).join(':').trim(); // Rejoin in case value has ':'

            if (key.includes('nama')) data.nama = value;
            else if (key.includes('alamat')) data.alamat = value;
            else if (key.includes('internet') || key.includes('inet')) data.noInternet = value;
            else if (key.includes('keluhan') || key.includes('kendala')) data.keluhan = value;
            else if (key.includes('layanan')) data.layanan = value;
            else if (key.includes('sn')) data.snOnt = value;
            else if (key.includes('pic') || key.includes('cp')) data.pic = value;
        });

        // Basic validation
        if (!data.nama && !data.keluhan) {
            msg.reply('Format laporan tidak dikenali. Mohon gunakan format:\n\nLAPOR\nNama: ...\nAlamat: ...\nNo Internet: ...\nKeluhan: ...\nLayanan: ...\nSN ONT: ...\nPIC: ...');
            return;
        }

        // Save to Sheet
        const ticketId = await saveReportToSheet(data);
        if (ticketId) {
            msg.reply(`✅ *LAPORAN DITERIMA & DISIMPAN*\n\nNo. Tiket: ${ticketId}\nNama: ${data.nama || '-'}\nAlamat: ${data.alamat || '-'}\nNo Layanan: ${data.noInternet || '-'}\nKendala: ${data.keluhan || '-'}\nLayanan: ${data.layanan || '-'}\nSN ONT: ${data.snOnt || '-'}\nPIC Contact: ${data.pic || '-'}\n\nData telah masuk ke Dashboard. Terima kasih!`);
        } else {
            msg.reply('❌ Maaf, terjadi kesalahan saat menyimpan laporan. Silakan coba lagi.');
        }
    }
    // Handle General Commands / Greetings
    else if (text === '/START' || text === 'MENU' || text === 'HELP' || text === 'HALO' || text === 'PING' || text === 'TEST') {
        const welcomeMsg = `🤖 *Hellow, I am Ticket Bot!*\n\nSaya siap mencatat laporan gangguan.\n\nKetik format berikut untuk lapor:\n\n*LAPOR*\nNama: [Nama Pelanggan]\nAlamat: [Alamat Lengkap]\nNo Internet: [No Inet]\nKeluhan: [Detail Kendala]\nLayanan: [Internet/Voice/IPTV]\nSN ONT: [Serial Number]\nPIC: [No HP PIC]\n\nAtau balas pesan ini jika butuh bantuan!`;
        msg.reply(welcomeMsg);
    }
});

// Prevent crash on WA library errors
process.on('uncaughtException', (err) => {
    console.error('Caught exception:', err);
    // Don't exit, keep running
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Don't exit
});

// WhatsApp: Get Groups
app.get('/api/wa-groups', async (req, res) => {
    if (!isWaReady) return res.status(503).json({ error: 'WhatsApp not ready yet' });
    try {
        const chats = await waClient.getChats();
        const groups = chats
            .filter(c => c.isGroup)
            .map(c => ({ id: c.id._serialized, name: c.name }));
        res.json(groups);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// WhatsApp: Send Message
app.post('/api/send-whatsapp', async (req, res) => {
    if (!isWaReady) return res.status(503).json({ error: 'WhatsApp not ready yet' });

    const { message, groupId } = req.body;
    if (!message || !groupId) return res.status(400).json({ error: 'Missing message or groupId' });

    try {
        await waClient.sendMessage(groupId, message);
        res.json({ success: true });
    } catch (e) {
        console.error('Send WA Error:', e);
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/laporan-langsung', async (req, res) => {
    try {
        const sheets = getSheetsClient();
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID_LAPORAN,
            range: "'Laporan Langsung'!A:Z",
        });

        const rows = response.data.values || [];
        console.log('Fetched Laporan Rows:', rows.length);

        // Header Check: If row[0] contains "Timestamp" or "Nama", assume it's a header and slice it.
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

app.get('/api/scrape', async (req, res) => {
    const inc = req.query.inc;
    if (!inc) return res.status(400).json({ error: 'Missing inc' });

    console.log(`Searching for: ${inc}`);

    if (!isSessionActive) {
        if (!isLoggingIn) await initBrowserAndLogin();
        else {
            while (isLoggingIn) await new Promise(r => setTimeout(r, 1000));
        }
    }

    if (!isSessionActive || !page) {
        return res.status(500).json({ error: 'Failed to initialize session. Please try again.' });
    }

    try {
        // Auto-Recovery Check
        const url = page.url();
        if (url.includes('login') || url.includes('insera-sso') || url.includes('setup')) {
            console.log('Session appears expired. Re-initializing...');
            isSessionActive = false;
            await initBrowserAndLogin();
            if (!isSessionActive) {
                return res.status(500).json({ error: 'Session expired. Relogin attempt failed.' });
            }
        }

        // Wait for Search Input
        const hasInput = await page.evaluate(() => {
            return !!(document.querySelector('input[placeholder*="Find"]') || document.querySelector('#quickSearchInput'));
        });

        if (!hasInput) {
            console.log('Search bar not ready. Waiting...');
            try {
                await page.waitForFunction(() => {
                    return document.querySelector('input[placeholder*="Find"]') ||
                        document.querySelector('#quickSearchInput') ||
                        document.querySelector('input.quickSearch');
                }, { timeout: 8000 });
            } catch (e) {
                console.log('Wait timeout. Go to Welcome...');
                await page.goto(LOGIN_URL, { waitUntil: 'networkidle0' });
            }
        }

        // Find Input
        let searchInput = null;
        try {
            await page.waitForFunction(() => {
                return document.querySelector('input[placeholder*="Find"]') ||
                    document.querySelector('#quickSearchInput') ||
                    document.querySelector('input.quickSearch');
            }, { timeout: 10000 });

            const selectors = ['input[placeholder*="Find"]', '#quickSearchInput', 'input.quickSearch'];
            for (const sel of selectors) {
                searchInput = await page.$(sel);
                if (searchInput) break;
            }
        } catch (e) { }

        if (!searchInput) {
            const path = 'server_error_search_missing.png';
            await page.screenshot({ path });
            throw new Error(`Search bar not found. Saved screenshot to ${path}`);
        }

        // --- ROBUST TYPE (Fix for "Not Clickable") ---
        await page.evaluate((el, text) => {
            el.value = '';
            el.focus();
            // Setting value directly often works best for these forms
            el.value = text;
        }, searchInput, inc);

        // Press Enter to trigger search
        await page.keyboard.press('Enter');

        // Wait for Results
        try {
            await page.waitForFunction(() => {
                return document.body.innerText.includes('Service ID') ||
                    document.body.innerText.includes('Customer Name') ||
                    document.body.innerText.includes('Workzone');
            }, { timeout: 12000 });
        } catch (e) { console.log('Wait timeout, trying scrape anyway'); }

        // --- SCRAPE (Fix for Customer Name) ---
        const scrapedData = await page.evaluate(() => {
            const data = {};

            const getRowInputs = (str) => {
                const els = Array.from(document.querySelectorAll('label, th, td, span, strong'));
                const label = els.find(el => el.innerText && el.innerText.trim() === str);
                if (!label) return [];

                let inputs = [];
                // 1. Same Container
                if (label.parentElement) {
                    inputs = inputs.concat(Array.from(label.parentElement.querySelectorAll('input:not([type="hidden"])')));
                    // 2. Next Sibling Container (e.g. Next TD)
                    const nextContainer = label.parentElement.nextElementSibling;
                    if (nextContainer) {
                        inputs = inputs.concat(Array.from(nextContainer.querySelectorAll('input:not([type="hidden"])')));
                    }
                }
                return inputs;
            };

            // 1. Customer Name (Logic: if 2 inputs found, 2nd is Name)
            const customerInputs = getRowInputs('Customer ID');
            if (customerInputs.length >= 2) {
                data.customerName = customerInputs[1].value;
            } else if (customerInputs.length === 1) {
                // Fallback: split by space/tab
                const val = customerInputs[0].value;
                // Heuristic: if starts with number, split
                if (/^\d+\s/.test(val)) {
                    data.customerName = val.replace(/^\d+\s+/, '');
                } else {
                    data.customerName = val;
                }
            } else {
                // Last ditch: check "Customer Name" label
                const nameInputs = getRowInputs('Customer Name');
                if (nameInputs.length > 0) data.customerName = nameInputs[0].value;
            }

            const sidInputs = getRowInputs('Service ID');
            if (sidInputs.length > 0) data.serviceId = sidInputs[0].value;

            const typeInputs = getRowInputs('Service Type');
            if (typeInputs.length > 0) data.serviceType = typeInputs[0].value;

            // Workzone often single input
            const zoneInputs = getRowInputs('Workzone');
            if (zoneInputs.length > 0) data.workzone = zoneInputs[0].value;

            return data;
        });

        console.log('Found:', scrapedData);
        res.json(scrapedData);

    } catch (e) {
        console.error('Search Error:', e.message);
        if (e.message.includes('Search bar not found') || e.message.includes('Session closed')) isSessionActive = false;
        res.status(500).json({ error: `Error: ${e.message}` });
    }
});

app.listen(PORT, () => {
    console.log(`Persistent Server running on http://localhost:${PORT}`);
    // initBrowserAndLogin(); // Disabled by user request
});
