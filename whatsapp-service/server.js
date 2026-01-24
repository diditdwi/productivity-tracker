const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// WhatsApp Client Setup
let isWaReady = false;
const waClient = new Client({
    authStrategy: new LocalAuth({
        dataPath: './wa-session'
    }),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ]
    }
});

// WhatsApp Events
waClient.on('qr', (qr) => {
    console.log('\n========================================');
    console.log('WHATSAPP QR CODE:');
    console.log('========================================\n');
    qrcode.generate(qr, { small: true });
    console.log('\n========================================');
    console.log('Scan QR code above with WhatsApp');
    console.log('========================================\n');
});

waClient.on('ready', () => {
    console.log('✅ WhatsApp Client is READY!');
    isWaReady = true;
});

waClient.on('authenticated', () => {
    console.log('✅ WhatsApp Authenticated');
});

waClient.on('auth_failure', (msg) => {
    console.error('❌ WhatsApp Auth Failure:', msg);
    isWaReady = false;
});

waClient.on('disconnected', (reason) => {
    console.log('⚠️ WhatsApp Disconnected:', reason);
    isWaReady = false;
});

// Initialize WhatsApp Client
console.log('🚀 Initializing WhatsApp Client...');
waClient.initialize();

// ==================== API ENDPOINTS ====================

// Health Check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'WhatsApp Service',
        whatsappReady: isWaReady,
        timestamp: new Date().toISOString()
    });
});

// WhatsApp Status
app.get('/api/wa-status', (req, res) => {
    res.json({
        ready: isWaReady,
        message: isWaReady ? 'WhatsApp client is ready' : 'WhatsApp client not ready'
    });
});

// Get WhatsApp Groups
app.get('/api/wa-groups', async (req, res) => {
    if (!isWaReady) {
        return res.status(503).json({ error: 'WhatsApp not ready yet' });
    }

    try {
        const chats = await waClient.getChats();
        const groups = chats
            .filter(c => c.isGroup)
            .map(c => ({ id: c.id._serialized, name: c.name }));
        res.json(groups);
    } catch (e) {
        console.error('Error getting groups:', e);
        res.status(500).json({ error: e.message });
    }
});

// Send WhatsApp Message
app.post('/api/send-whatsapp', async (req, res) => {
    console.log('📨 WhatsApp send request received. WA Ready:', isWaReady);

    if (!isWaReady) {
        console.log('❌ WhatsApp client not ready');
        return res.status(503).json({ error: 'WhatsApp not ready yet' });
    }

    const { message, groupId } = req.body;
    console.log('📱 Attempting to send to:', groupId);

    if (!message || !groupId) {
        return res.status(400).json({ error: 'Missing message or groupId' });
    }

    try {
        console.log('📤 Sending WhatsApp message...');
        await waClient.sendMessage(groupId, message);
        console.log('✅ WhatsApp message sent successfully to:', groupId);
        res.json({ success: true, message: 'Message sent successfully' });
    } catch (e) {
        console.error('❌ Send WA Error:', e);
        res.status(500).json({ error: e.message });
    }
});

// Error handling
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start Server
app.listen(PORT, () => {
    console.log('\n========================================');
    console.log(`🚀 WhatsApp Service running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
    console.log(`📊 Status: http://localhost:${PORT}/api/wa-status`);
    console.log('========================================\n');
});
