const { google } = require('googleapis');
const path = require('path');
require('dotenv').config();

const KEY_FILE_PATH = path.join(__dirname, 'service-account.json');
const SHEET_ID = '10acdd8iMG0frwgirsZJGm9bsQYbFfxOCizHGcguCfYg'; // SPPG ID

async function checkSheets() {
    const auth = new google.auth.GoogleAuth({
        keyFile: KEY_FILE_PATH,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = google.sheets({ version: 'v4', auth });
    
    try {
        const res = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
        console.log("Sheet Title:", res.data.properties.title);
        console.log("Sheets:", res.data.sheets.map(s => s.properties.title));
    } catch (error) {
        console.error("Error:", error.message);
    }
}

checkSheets();
