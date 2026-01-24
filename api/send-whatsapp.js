// Native fetch is available in Vercel Node.js 18+

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

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { message, groupId } = req.body;

    if (!message || !groupId) {
        return res.status(400).json({ error: 'Missing message or groupId' });
    }

    try {
        // 76.13.20.234:3002 is the VPS running wa-bot-interactive
        // We force HTTP protocol to allow communication from Vercel Serverless Function
        const vpsUrl = 'http://76.13.20.234:3002/api/send-whatsapp';

        console.log(`[Proxy] Forwarding request to: ${vpsUrl}`);
        console.log(`[Proxy] Payload:`, JSON.stringify({ message, groupId }));

        const backendRes = await fetch(vpsUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message, groupId }),
        });

        if (!backendRes.ok) {
            const errorText = await backendRes.text();
            console.error('[Proxy] VPS Error Response:', backendRes.status, errorText);
            return res.status(backendRes.status).json({
                error: `VPS Error (${backendRes.status}): ${errorText}`,
                details: 'Connection to VPS established but returned error.'
            });
        }

        const data = await backendRes.json();
        console.log('[Proxy] Success:', data);
        return res.status(200).json(data);

    } catch (error) {
        console.error('[Proxy] Connection Network Error:', error);
        return res.status(500).json({
            error: `Connection Failed: ${error.message}`,
            details: 'Check if VPS is online, port 3002 is open, and firewall allows traffic.'
        });
    }
}
