const { google } = require('googleapis');
const path = require('path');
require('dotenv').config();

const KEY_FILE_PATH = path.join(__dirname, 'service-account.json');
const SHEET_ID_GARANSI = process.env.SHEET_ID_GARANSI;
const TARGET_ID = '131164139106';

async function debugFFG() {
    console.log(`🔍 Debugging FFG for Speedy: ${TARGET_ID}`);
    const auth = new google.auth.GoogleAuth({
        keyFile: KEY_FILE_PATH,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = google.sheets({ version: 'v4', auth });
    
    try {
        // 1. Fetch Garansi Data
        console.log("Fetching Garansi Sheet...");
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID_GARANSI,
            range: "'Bandung Barat dan Cianjur'!O2:BD10000",
        });
        
        const rows = res.data.values || [];
        console.log(`Found ${rows.length} rows in Garansi.`);
        
        let found = false;
        rows.forEach((row, idx) => {
            const speedy = String(row[0]).trim();
            const umur = row[41];
            
            if (speedy.includes(TARGET_ID)) {
                console.log(`✅ MATCH FOUND at Row ${idx + 2} (Index ${idx})`);
                console.log(`   Speedy Raw: '${row[0]}'`);
                console.log(`   Speedy Clean: '${speedy}'`);
                console.log(`   Umur Raw: '${umur}'`);
                console.log(`   Umur Parsed: ${parseInt(umur)}`);
                found = true;
            }
        });
        
        if (!found) {
            console.log("❌ Target ID NOT FOUND in Garansi Sheet O2:BD10000");
        }
        
    } catch (error) {
        console.error("Error:", error.message);
    }
}

debugFFG();
