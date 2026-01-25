const { google } = require('googleapis');
const path = require('path');
require('dotenv').config();

const KEY_FILE_PATH = path.join(__dirname, 'service-account.json');
const SHEET_ID = '10acdd8iMG0frwgirsZJGm9bsQYbFfxOCizHGcguCfYg'; // SPPG ID
const SHEET_NAME = 'List SPPG BANDUNG RAYA';

async function checkColumns() {
    const auth = new google.auth.GoogleAuth({
        keyFile: KEY_FILE_PATH,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = google.sheets({ version: 'v4', auth });
    
    try {
        // Fetch O1 (Header) and BD1 (Header)
        const res = await sheets.spreadsheets.values.batchGet({
            spreadsheetId: SHEET_ID,
            ranges: [`'${SHEET_NAME}'!O1:O5`, `'${SHEET_NAME}'!BD1:BD5`]
        });
        
        const speedys = res.data.valueRanges[0].values;
        const umurs = res.data.valueRanges[1].values;
        
        console.log("Column O (Speedy):", speedys);
        console.log("Column BD (Umur Garansi):", umurs);
        
    } catch (error) {
        console.error("Error:", error.message);
    }
}

checkColumns();
