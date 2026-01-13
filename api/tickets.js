import { google } from 'googleapis';

export default async function handler(req, res) {
    // CORS configuration
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Environment Variables
    const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
    const SHEET_NAME = process.env.SHEET_NAME || 'Produktivitas B2B BARAYA';

    // Handling Credentials from ENV (for Vercel)
    // Ensure private key handles newlines correctly
    const privateKey = process.env.GOOGLE_PRIVATE_KEY
        ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
        : undefined;

    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;

    if (!SPREADSHEET_ID || !privateKey || !clientEmail) {
        return res.status(500).json({
            error: 'Missing server configuration (SPREADSHEET_ID, GOOGLE_CLIENT_EMAIL, or GOOGLE_PRIVATE_KEY)'
        });
    }

    try {
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: clientEmail,
                private_key: privateKey,
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const sheets = google.sheets({ version: 'v4', auth });

        if (req.method === 'GET') {
            const getRes = await sheets.spreadsheets.values.get({
                spreadsheetId: SPREADSHEET_ID,
                range: `${SHEET_NAME}!A:M`,
            });

            const rows = getRes.data.values || [];
            const tickets = rows.slice(1).map((row, index) => ({
                id: index + '-' + row[2],
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

            return res.status(200).json(tickets);
        }

        else if (req.method === 'POST') {
            const ticket = req.body;
            const {
                date, ticketType, incident, customerName, serviceId,
                serviceType, technician, labcode, repair, status,
                workzone, hdOfficer
            } = ticket;

            // Check existing
            const getRes = await sheets.spreadsheets.values.get({
                spreadsheetId: SPREADSHEET_ID,
                range: `${SHEET_NAME}!C:C`, // Incident Column
            });

            const rows = getRes.data.values || [];
            let rowIndex = -1;

            for (let i = 0; i < rows.length; i++) {
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
                return res.status(200).json({ message: 'Updated', type: 'UPDATE' });
            } else {
                await sheets.spreadsheets.values.append({
                    spreadsheetId: SPREADSHEET_ID,
                    range: `${SHEET_NAME}!A:A`,
                    valueInputOption: 'USER_ENTERED',
                    requestBody: { values: [rowData] }
                });
                return res.status(200).json({ message: 'Created', type: 'CREATE' });
            }
        }

        else {
            res.setHeader('Allow', ['GET', 'POST']);
            return res.status(405).end(`Method ${req.method} Not Allowed`);
        }

    } catch (error) {
        console.error('Sheet API Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
