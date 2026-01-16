
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

export default async function handler(req, res) {
    try {
        const SPREADSHEET_ID = '1PvOheQ9IO8Xs6aBGAn96AxItQYyLmmkEk0kKgdsUkfk'; // Hardcoded ID
        const auth = getAuth();
        const sheets = google.sheets({ version: 'v4', auth });

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: "'Laporan Langsung'!A:Z",
        });

        const rows = response.data.values || [];

        // Skip header if exists (simple check)
        const dataRows = (rows.length > 0 && (rows[0][0] === 'Timestamp' || rows[0][0] === 'Waktu'))
            ? rows.slice(1)
            : rows;

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

        res.status(200).json(data);
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ error: error.message });
    }
}
