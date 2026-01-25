const { google } = require('googleapis');
const path = require('path');
require('dotenv').config();

const KEY_FILE_PATH = path.join(__dirname, 'service-account.json');
const SHEET_ID_LAPORAN = process.env.SPREADSHEET_ID; // "1PvOheQ9IO8Xs6aBGAn96AxItQYyLmmkEk0kKgdsUkfk"
const TARGET_ID = '131164139106';

async function debugLaporanInput() {
    console.log(`🔍 Debugging Laporan Langsung Input for: ${TARGET_ID}`);
    const auth = new google.auth.GoogleAuth({
        keyFile: KEY_FILE_PATH,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = google.sheets({ version: 'v4', auth });
    
    try {
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID_LAPORAN,
            range: "'Laporan Langsung'!A:Z",
        });
        
        const rows = res.data.values || [];
        console.log(`Found ${rows.length} rows in Laporan Langsung.`);
        
        // Find row with target ID in col 3 (No Internet)
        // Col Index: 0=Timestamp, 1=Nama, 2=Alamat, 3=NoInternet
        
        rows.forEach((row, idx) => {
            const noInet = String(row[3] || '');
            if (noInet.includes(TARGET_ID)) {
                console.log(`✅ MATCH FOUND at Row ${idx + 1}`);
                console.log(`   Raw NoInternet: '${row[3]}'`);
                console.log(`   Length: ${noInet.length}`);
                console.log(`   Safe String: '${noInet.trim()}'`);
                console.log(`   ASCII Codes: ${noInet.split('').map(c => c.charCodeAt(0))}`);
            }
        });
        
    } catch (error) {
        console.error("Error:", error.message);
    }
}

debugLaporanInput();
