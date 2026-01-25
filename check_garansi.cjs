const { google } = require('googleapis');
const path = require('path');
require('dotenv').config();

const KEY_FILE_PATH = path.join(__dirname, 'service-account.json');
const SHEET_ID = process.env.SHEET_ID_GARANSI;

async function checkGaransiSheet() {
    console.log("Checking Sheet ID:", SHEET_ID);
    const auth = new google.auth.GoogleAuth({
        keyFile: KEY_FILE_PATH,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = google.sheets({ version: 'v4', auth });
    
    try {
        const res = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
        console.log("Sheet Title:", res.data.properties.title);
        console.log("Sheets Found:");
        res.data.sheets.forEach(s => console.log(`- ${s.properties.title}`));
    } catch (error) {
        console.error("Error:", error.message);
    }
}

checkGaransiSheet();
