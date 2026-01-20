# WhatsApp Service - Standalone Deployment

Standalone WhatsApp service untuk Productivity Tracker yang berjalan di VPS terpisah.

## 🚀 Quick Start (VPS Deployment)

### Prerequisites
- VPS dengan Ubuntu 20.04+ atau Debian 10+
- Root access
- Port 3001 terbuka

### Deployment Steps

1. **Upload files ke VPS**
   ```bash
   # Di local machine
   scp -r whatsapp-service root@YOUR_VPS_IP:/tmp/
   ```

2. **SSH ke VPS**
   ```bash
   ssh root@YOUR_VPS_IP
   ```

3. **Jalankan deployment script**
   ```bash
   cd /tmp/whatsapp-service
   chmod +x deploy.sh
   ./deploy.sh
   ```

4. **Scan QR Code**
   ```bash
   pm2 logs whatsapp-service
   # Scan QR code yang muncul dengan WhatsApp
   ```

5. **Verify Service**
   ```bash
   curl http://localhost:3001/health
   ```

## 📱 WhatsApp QR Code

Setelah deployment, QR code akan muncul di logs. Scan dengan WhatsApp:

```bash
pm2 logs whatsapp-service --lines 50
```

## 🔧 Configuration

### Environment Variables (Optional)

Create `.env` file:
```env
PORT=3001
NODE_ENV=production
```

### Firewall

Pastikan port 3001 terbuka:
```bash
sudo ufw allow 3001/tcp
sudo ufw reload
```

### Nginx Reverse Proxy (Optional)

Jika ingin menggunakan domain:

```nginx
server {
    listen 80;
    server_name wa.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 📊 API Endpoints

### Health Check
```bash
GET http://YOUR_VPS_IP:3001/health
```

### WhatsApp Status
```bash
GET http://YOUR_VPS_IP:3001/api/wa-status
```

### Get WhatsApp Groups
```bash
GET http://YOUR_VPS_IP:3001/api/wa-groups
```

### Send WhatsApp Message
```bash
POST http://YOUR_VPS_IP:3001/api/send-whatsapp
Content-Type: application/json

{
  "message": "Hello World",
  "groupId": "628123456789@c.us"
}
```

## 🛠️ Management Commands

### PM2 Commands
```bash
# View logs
pm2 logs whatsapp-service

# Restart service
pm2 restart whatsapp-service

# Stop service
pm2 stop whatsapp-service

# Start service
pm2 start whatsapp-service

# View status
pm2 status

# Monitor
pm2 monit
```

### Service Management
```bash
# Start on boot
pm2 startup
pm2 save

# Remove from boot
pm2 unstartup
```

## 🔄 Update Frontend

Update `src/constants.js` di frontend Vercel:

```javascript
// Development
export const WA_SERVICE_URL = 'http://localhost:3001'

// Production
export const WA_SERVICE_URL = 'http://YOUR_VPS_IP:3001'
// atau jika pakai domain:
export const WA_SERVICE_URL = 'https://wa.yourdomain.com'
```

Update API calls di `LaporanLangsungDashboard.jsx`:

```javascript
// Ganti API_URL_SEND_WA dengan WA_SERVICE_URL
import { WA_SERVICE_URL } from '../constants'

// Di fungsi confirmSend dan submitCloseTicket:
await fetch(`${WA_SERVICE_URL}/api/send-whatsapp`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(waPayload)
});
```

## 🐛 Troubleshooting

### QR Code tidak muncul
```bash
pm2 restart whatsapp-service
pm2 logs whatsapp-service --lines 100
```

### Service tidak jalan
```bash
pm2 status
pm2 logs whatsapp-service --err
```

### Port sudah digunakan
```bash
# Cek port
sudo lsof -i :3001

# Kill process
sudo kill -9 <PID>
```

### WhatsApp disconnected
```bash
# Hapus session dan restart
rm -rf /opt/whatsapp-service/wa-session
pm2 restart whatsapp-service
# Scan QR code lagi
```

## 📝 Logs Location

```
/opt/whatsapp-service/logs/
├── error.log      # Error logs
├── out.log        # Output logs
└── combined.log   # Combined logs
```

## 🔒 Security

1. **Firewall**: Hanya allow IP frontend Vercel
   ```bash
   sudo ufw allow from VERCEL_IP to any port 3001
   ```

2. **API Key**: Tambahkan authentication (optional)
   ```javascript
   // Di server.js
   const API_KEY = process.env.API_KEY;
   
   app.use((req, res, next) => {
     const key = req.headers['x-api-key'];
     if (key !== API_KEY) {
       return res.status(401).json({ error: 'Unauthorized' });
     }
     next();
   });
   ```

## 📞 Support

Jika ada masalah:
1. Check logs: `pm2 logs whatsapp-service`
2. Check status: `pm2 status`
3. Restart: `pm2 restart whatsapp-service`
