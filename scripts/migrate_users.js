
import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';

// CANNOT import constants directly because it contains 'import.meta.env' (Vite only)
// import { TEKNISI_LIST, HD_OFFICERS } from '../src/constants.js';

const KEY_FILE_PATH = path.join(process.cwd(), 'service-account.json');
const SPREADSHEET_ID = '1PvOheQ9IO8Xs6aBGAn96AxItQYyLmmkEk0kKgdsUkfk';
const TARGET_SHEET = 'Staff';

const getSheetsClient = () => {
    const auth = new google.auth.GoogleAuth({
        keyFile: KEY_FILE_PATH,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    return google.sheets({ version: 'v4', auth });
};

// Helper to manually parse the array from file content
function extractArrayFromFile(content, variableName) {
    const regex = new RegExp(`export const ${variableName} = \\[([\\s\\S]*?)\\]`);
    const match = content.match(regex);
    if (!match) return [];
    
    // Clean up the inner content to make it JSON-parseable or just eval-able
    let inner = match[1];
    
    // Remove comments if any (simple check)
    // Convert single quotes to double quotes for JSON.parse
    // But it's easier to just split by line and clean up string literals
    const items = inner.split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('//'))
        .map(line => {
             // Extract content between quotes
             const quoteMatch = line.match(/['"](.*)['"]/);
             return quoteMatch ? quoteMatch[1] : null;
        })
        .filter(item => item !== null);
        
    return items;
}

async function migrate() {
    console.log('Starting migration...');
    
    // Read constants.js raw
    const constantsPath = path.join(process.cwd(), 'src', 'constants.js');
    const fileContent = fs.readFileSync(constantsPath, 'utf-8');
    
    const teknisiList = extractArrayFromFile(fileContent, 'TEKNISI_LIST');
    const hdOfficers = extractArrayFromFile(fileContent, 'HD_OFFICERS');

    console.log(`Found ${teknisiList.length} Technicians`);
    console.log(`Found ${hdOfficers.length} HD Officers`);

    // Prepare Data
    const rows = [];
    
    // Technicians
    teknisiList.forEach(fullStr => {
        const parts = fullStr.split(' - ');
        if (parts.length >= 2) {
            rows.push(['TECHNICIAN', parts[0].trim(), parts.slice(1).join(' - ').trim(), fullStr]);
        } else {
             rows.push(['TECHNICIAN', 'Unknown', fullStr, fullStr]);
        }
    });
    
    // HD Officers
    hdOfficers.forEach(fullStr => {
        const parts = fullStr.split(' - ');
         if (parts.length >= 2) {
            rows.push(['HD', parts[0].trim(), parts.slice(1).join(' - ').trim(), fullStr]);
        } else {
             rows.push(['HD', 'Unknown', fullStr, fullStr]);
        }
    });
    
    console.log(`Prepared ${rows.length} rows to insert.`);
    
    if (rows.length === 0) {
        console.log("No data to migrate. Exiting.");
        return;
    }

    const sheets = getSheetsClient();
    
    try {
        await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: `'${TARGET_SHEET}'!A:D`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: rows }
        });
        
        console.log('Migration successful!');
    } catch (e) {
        console.error('Migration failed:', e.message);
        if (e.message.includes('Unable to parse range')) {
            console.error(`Check if tab '${TARGET_SHEET}' exists!`);
        }
    }
}

migrate();
