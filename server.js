import express from 'express';
import cors from 'cors';
import { google } from 'googleapis';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;

// Configuration
const SPREADSHEET_ID = process.env.SPREADSHEET_ID || '';
const SHEET_NAME = process.env.SHEET_NAME || 'Produktivitas B2B BARAYA';

// Service Account Auth
const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, 'service-account.json'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

app.get('/api/tickets', async (req, res) => {
    try {
        if (!SPREADSHEET_ID) {
            console.warn('SPREADSHEET_ID not set');
            return res.json([]);
        }
        const getRes = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_NAME}!A:M`,
        });

        const rows = getRes.data.values || [];
        const tickets = rows.slice(1).map((row, index) => ({
            id: index + '-' + row[2], // unique-ish id
            date: row[0],
            ticketType: row[1],
            incident: row[2],
            customerName: row[3],
            serviceId: row[4],
            serviceType: row[5],
            technician: row[6],
            labcode: row[7],
            repair: row[8],
            status: row[9],
            workzone: row[10],
            hdOfficer: row[11],
            timestamp: row[12]
        })).reverse();

        res.json(tickets);
    } catch (error) {
        console.error('Error fetching tickets:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/tickets', async (req, res) => {
    try {
        const ticket = req.body;
        const {
            date, ticketType, incident, customerName, serviceId,
            serviceType, technician, labcode, repair, status,
            workzone, hdOfficer
        } = ticket;

        if (!SPREADSHEET_ID) throw new Error('SPREADSHEET_ID is missing');

        // 1. Check for existing
        const getRes = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_NAME}!C:C`, // Column C is Incident
        });

        const rows = getRes.data.values || [];
        let rowIndex = -1;

        // Find row index (1-based)
        for (let i = 0; i < rows.length; i++) {
            // rows[i][0] because we fetched only one column C
            if (rows[i][0] === incident) {
                rowIndex = i + 1;
                break;
            }
        }

        const rowData = [
            date,
            ticketType,
            incident,
            customerName,
            serviceId,
            serviceType,
            technician,
            labcode || '',
            repair,
            status,
            workzone,
            hdOfficer,
            new Date().toLocaleString()
        ];

        if (rowIndex !== -1) {
            await sheets.spreadsheets.values.update({
                spreadsheetId: SPREADSHEET_ID,
                range: `${SHEET_NAME}!A${rowIndex}`,
                valueInputOption: 'USER_ENTERED',
                requestBody: { values: [rowData] }
            });
            res.json({ message: 'Updated', type: 'UPDATE' });
        } else {
            await sheets.spreadsheets.values.append({
                spreadsheetId: SPREADSHEET_ID,
                range: `${SHEET_NAME}!A:A`,
                valueInputOption: 'USER_ENTERED',
                requestBody: { values: [rowData] }
            });
            res.json({ message: 'Created', type: 'CREATE' });
        }

    } catch (error) {
        console.error('Error saving ticket:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
