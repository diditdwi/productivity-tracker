import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { TEKNISI_LIST, HD_OFFICERS } from '../src/constants.js';

// Configuration
const SPREADSHEET_ID = '1PvOheQ9IO8Xs6aBGAn96AxItQYyLmmkEk0kKgdsUkfk';
const SHEET_NAME = 'All tiket';
const KEY_FILE_PATH = path.join(process.cwd(), 'service-account.json');

// --- RESOLVER HELPER ---
const resolveName = (value, list) => {
    if (!value) return value;
    const strVal = String(value).trim();
    
    // If it's already "NIK - Name", ignore
    if (strVal.includes(' - ')) return strVal;
    
    // If it is just digits, try to find it
    if (/^\d+$/.test(strVal) && list) {
        // Find item that starts with this ID
        const found = list.find(item => item.startsWith(strVal));
        if (found) {
            console.log(`Resolved: ${strVal} -> ${found}`);
            return found;
        }
    }
    
    // If it is just a Name (text), try to find "NIK - Name"
    // This handles cases where user previously entered just "SAEPUDIN"
    if (!/^\d+$/.test(strVal)) {
        const found = list.find(item => {
             const parts = item.split(' - ');
             if (parts.length < 2) return false;
             return parts[1].toLowerCase().includes(strVal.toLowerCase());
        });
        if (found) {
             console.log(`Resolved Name: ${strVal} -> ${found}`);
             return found;
        }
    }

    return strVal;
};

async function main() {
    console.log('Starting Fix Script...');
    
    if (!fs.existsSync(KEY_FILE_PATH)) {
        console.error('Service Account file not found:', KEY_FILE_PATH);
        process.exit(1);
    }

    const auth = new google.auth.GoogleAuth({
        keyFile: KEY_FILE_PATH,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    try {
        // 1. Read All Data
        console.log('Reading Sheet...');
        const getRes = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `'${SHEET_NAME}'!A:M`,
        });

        const rows = getRes.data.values;
        if (!rows || rows.length === 0) {
            console.log('No data found.');
            return;
        }

        console.log(`Found ${rows.length} rows.`);

        // 2. Iterate and Update
        const updates = [];
        
        const unresolvedTechs = new Set();
        const unresolvedHds = new Set();

        // Start from index 1 (skip header)
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            const rowIndex = i + 1;
            
            // Indices: 6 = Technician, 11 = HD Officer
            const oldTech = row[6] || '';
            const oldHd = row[11] || '';
            
            const newTech = resolveName(oldTech, TEKNISI_LIST);
            const newHd = resolveName(oldHd, HD_OFFICERS);
            
            // Check if still numeric (failed to resolve)
            if (/^\d+$/.test(newTech.trim()) && newTech.trim().length > 4) {
                unresolvedTechs.add(newTech.trim());
            }
            if (/^\d+$/.test(newHd.trim()) && newHd.trim().length > 4) {
                unresolvedHds.add(newHd.trim());
            }

            let needsUpdate = false;
            
            if (newTech !== oldTech) {
                console.log(`Row ${rowIndex} Tech Change: "${oldTech}" -> "${newTech}"`);
                needsUpdate = true;
            }
            if (newHd !== oldHd) {
                console.log(`Row ${rowIndex} HD Change: "${oldHd}" -> "${newHd}"`);
                needsUpdate = true;
            }
            
            if (needsUpdate) {
                // Determine ranges to update
                if (newTech !== oldTech) {
                     updates.push({
                        range: `'${SHEET_NAME}'!G${rowIndex}`,
                        values: [[newTech]]
                     });
                }
                
                if (newHd !== oldHd) {
                     updates.push({
                        range: `'${SHEET_NAME}'!L${rowIndex}`,
                        values: [[newHd]]
                     });
                }
            }
        }
        
        console.log(`Total cells to update: ${updates.length}`);
        
        if (unresolvedTechs.size > 0) {
            console.warn("\n⚠️  WARNING: Could not resolve the following Technician NIKs (Not in predefined list):");
            console.warn([...unresolvedTechs].join(", "));
        }
        
        if (unresolvedHds.size > 0) {
            console.warn("\n⚠️  WARNING: Could not resolve the following HD Officer NIKs (Not in predefined list):");
            console.warn([...unresolvedHds].join(", "));
        }
        
        if (updates.length === 0) {
            console.log("No updates needed.");
            return;
        }

        // 3. Batch Update
        const data = updates.map(u => ({
            range: u.range,
            values: u.values
        }));

        await sheets.spreadsheets.values.batchUpdate({
            spreadsheetId: SPREADSHEET_ID,
            requestBody: {
                valueInputOption: 'USER_ENTERED',
                data: data
            }
        });

        console.log("Database update complete! ✅");

    } catch (e) {
        console.error("Error:", e);
    }
}

main();
