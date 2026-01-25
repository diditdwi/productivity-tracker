const { google } = require('googleapis');
const path = require('path');
require('dotenv').config();

const KEY_FILE_PATH = path.join(__dirname, 'service-account.json');
const SHEET_ID = process.env.SHEET_ID_GARANSI;
const SHEET_NAME = 'Bandung Barat dan Cianjur'; // Asumsi sheet utama

async function checkData() {
    const auth = new google.auth.GoogleAuth({
        keyFile: KEY_FILE_PATH,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = google.sheets({ version: 'v4', auth });
    
    try {
        // Ambil Header untuk memastikan posisi kolom
        // Kita butuh kolom O (Speedy) dan BD (Umur Garansi)
        // O is index 14, BD is index 55 (A=0, Z=25, AA=26, AZ=51, BA=52, BD=55)
        
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: `'${SHEET_NAME}'!A1:BE5` // Grab enough columns to check headers
        });
        
        const headers = res.data.values[0];
        console.log("Header O (Index 14):", headers[14]);
        console.log("Header BD (Index 55):", headers[55]);
        
        // Ambil sampel data
        const dataRes = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: `'${SHEET_NAME}'!O2000:BD2005` // Sample rows around 2000
        });
        
         if (dataRes.data.values) {
            console.log("Sample Data:");
            dataRes.data.values.forEach(row => {
               // O is relative 0, BD is relative (55-14) = 41
               console.log(`Speedy: ${row[0]}, Umur: ${row[41]}`);
            });
         }

    } catch (error) {
        console.error("Error:", error.message);
    }
}

checkData();
