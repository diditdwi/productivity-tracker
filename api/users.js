
import { google } from 'googleapis';

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,DELETE');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Auth
    const SPREADSHEET_ID = process.env.SPREADSHEET_ID || '1PvOheQ9IO8Xs6aBGAn96AxItQYyLmmkEk0kKgdsUkfk';
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY
        ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
        : undefined;

    if (!clientEmail || !privateKey) {
        return res.status(500).json({ error: 'Missing Google Credentials' });
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
        const SHEET_NAME = 'Staff';

        // GET: List all users
        if (req.method === 'GET') {
            try {
                const response = await sheets.spreadsheets.values.get({
                    spreadsheetId: SPREADSHEET_ID,
                    range: `'${SHEET_NAME}'!A:D`,
                });

                const rows = response.data.values || [];
                // rows: [Type, ID, Name, FullString]
                
                const technicians = [];
                const hdOfficers = [];

                rows.forEach(row => {
                    if (!row || row.length < 4) return;
                    const [type, id, name, fullString] = row;
                    
                    if (type === 'TECHNICIAN') {
                        technicians.push(fullString);
                    } else if (type === 'HD') {
                        hdOfficers.push(fullString);
                    }
                });

                return res.status(200).json({ technicians, hdOfficers });
            } catch (e) {
                // If sheet not found
                if (e.message.includes('Unable to parse range')) {
                     return res.status(200).json({ technicians: [], hdOfficers: [] });
                }
                throw e;
            }
        }

        // POST: Add new user
        if (req.method === 'POST') {
            const { type, id, name } = req.body;
            
            if (!type || !id || !name) {
                return res.status(400).json({ error: 'Missing fields: type, id, name' });
            }

            const validTypes = ['TECHNICIAN', 'HD'];
            if (!validTypes.includes(type)) {
                return res.status(400).json({ error: 'Invalid type. Must be TECHNICIAN or HD' });
            }

            const fullString = `${id} - ${name}`;
            const row = [type, id, name, fullString];

            await sheets.spreadsheets.values.append({
                spreadsheetId: SPREADSHEET_ID,
                range: `'${SHEET_NAME}'!A:D`,
                valueInputOption: 'USER_ENTERED',
                requestBody: { values: [row] }
            });

            return res.status(200).json({ success: true, fullString });
        }

        return res.status(405).json({ error: 'Method not allowed' });

    } catch (error) {
        console.error('API Users Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
