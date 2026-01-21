
import { google } from 'googleapis';

// Load credentials based on environment
const getAuth = () => {
    // 1. Try Environment Variable (Best for Vercel)
    if (process.env.GOOGLE_CREDENTIALS) {
        const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
        return new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });
    }

    // 2. Fallback (This won't usually work on Vercel unless file is committed)
    throw new Error('GOOGLE_CREDENTIALS env var not found');
};

// Global Cache for Vercel (Persists in Warm Lambdas)
let garansiCache = new Map();
let lastGaransiFetch = 0;

async function updateGaransiCache(sheets) {
    const GARANSI_SHEET_ID = process.env.SHEET_ID_GARANSI;
    const now = Date.now();

    // Cache valid for 1 hour
    if (garansiCache.size > 0 && (now - lastGaransiFetch) < 3600000) {
        return;
    }

    if (!GARANSI_SHEET_ID) {
        console.warn("⚠️ SHEET_ID_GARANSI not set in Vercel Environment Variables");
        return;
    }

    try {
        console.log("🔄 Updating Garansi Cache (Vercel)...");
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId: GARANSI_SHEET_ID,
            range: "'Bandung Barat dan Cianjur'!O2:BD10000",
        });

        const rows = res.data.values || [];
        const newCache = new Map();

        rows.forEach(row => {
            const speedy = row[0]; // Col O
            const umur = row[41];  // Col BD (Index 55 - 14 = 41)

            if (speedy) {
                const cleanSpeedy = String(speedy).trim();
                const umurVal = parseInt(umur);
                if (!isNaN(umurVal)) {
                    newCache.set(cleanSpeedy, umurVal);
                }
            }
        });

        garansiCache = newCache;
        lastGaransiFetch = now;
        console.log(`✅ Garansi Cache Updated. Size: ${garansiCache.size}`);

    } catch (e) {
        console.error("❌ Failed to update Garansi cache:", e.message);
    }
}

export default async function handler(req, res) {
    try {
        const SPREADSHEET_ID = '1PvOheQ9IO8Xs6aBGAn96AxItQYyLmmkEk0kKgdsUkfk';
        const auth = getAuth();
        const sheets = google.sheets({ version: 'v4', auth });

        // Handle Status Update
        if (req.method === 'POST') {
            const { ticketId, status } = req.body;
            if (!ticketId || !status) {
                return res.status(400).json({ error: 'Missing ticketId or status' });
            }

            // Find Row Index based on Ticket ID (Column J)
            const idRes = await sheets.spreadsheets.values.get({
                spreadsheetId: SPREADSHEET_ID,
                range: "'Laporan Langsung'!J:J",
            });

            const rows = idRes.data.values || [];
            let rowIndex = -1;

            for (let i = 0; i < rows.length; i++) {
                if (rows[i][0] && rows[i][0].trim() === ticketId.trim()) {
                    rowIndex = i + 1; // 1-based index
                    break;
                }
            }

            if (rowIndex === -1) {
                return res.status(404).json({ error: 'Ticket ID not found' });
            }

            // Update Status (Column I)
            await sheets.spreadsheets.values.update({
                spreadsheetId: SPREADSHEET_ID,
                range: `'Laporan Langsung'!I${rowIndex}`,
                valueInputOption: 'USER_ENTERED',
                requestBody: { values: [[status]] }
            });

            // FORWARD NOTIFICATION TO VPS BOT (Server-to-Server to avoid Mixed Content)
            if (req.body.notification) {
                try {
                    console.log('🔄 Forwarding WA Notification to VPS...');
                    const waRes = await fetch('http://76.13.20.234:3001/api/send-whatsapp', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(req.body.notification)
                    });

                    if (!waRes.ok) {
                        console.error('❌ VPS Bot returned error:', await waRes.text());
                    } else {
                        console.log('✅ VPS Bot accepted notification');
                    }
                } catch (waError) {
                    console.error('❌ Failed to contact VPS Bot:', waError.message);
                }
            }

            return res.status(200).json({ success: true, message: 'Status updated & Notification processed' });
        }

        // Update Cache (Non-blocking usually, but here we await to ensure first load works)
        await updateGaransiCache(sheets);

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: "'Laporan Langsung'!A:Z",
        });

        const rows = response.data.values || [];

        // Skip header if exists
        const dataRows = (rows.length > 0 && (rows[0][0] && (rows[0][0].toLowerCase().includes('timestamp') || rows[0][0].toLowerCase().includes('waktu'))))
            ? rows.slice(1)
            : rows;

        const data = dataRows.map((row, idx) => {
            const noInternet = String(row[3] || '').trim();
            let isFFG = false;
            let umurGaransi = null;

            // FFG Check
            if (garansiCache.has(noInternet)) {
                umurGaransi = garansiCache.get(noInternet);
                if (umurGaransi <= 60) { // Logic: < 60 or <= 60? User said "within 60 (guarantee age)" usually implies <=
                    isFFG = true;
                }
            }

            return {
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
                ticketId: row[9] || '-',
                isFFG,
                umurGaransi
            };
        }).reverse();

        res.status(200).json(data);
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ error: error.message });
    }
}
