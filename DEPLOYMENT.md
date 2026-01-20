# 🚀 Quick Deployment Guide - VPS 76.13.20.234

## Step-by-Step Deployment

### 1️⃣ Upload Files ke VPS

```bash
# Di local machine (Windows PowerShell atau Git Bash)
cd c:\claude\productivity-tracker
scp -r whatsapp-service root@76.13.20.234:/tmp/
```

**Password:** Masukkan password root VPS Anda

---

### 2️⃣ SSH ke VPS

```bash
ssh root@76.13.20.234
```

---

### 3️⃣ Deploy WhatsApp Service

```bash
cd /tmp/whatsapp-service
chmod +x deploy.sh
./deploy.sh
```

Script akan otomatis:
- ✅ Install Node.js (jika belum ada)
- ✅ Install PM2
- ✅ Install dependencies
- ✅ Start service
- ✅ Setup auto-start on boot

---

### 4️⃣ Scan QR Code WhatsApp

```bash
pm2 logs whatsapp-service --lines 50
```

**Akan muncul QR code seperti ini:**
```
========================================
WHATSAPP QR CODE:
========================================

█████████████████████████████████
█████████████████████████████████
███ ▄▄▄▄▄ █▀█ █▄▄▀▄█ ▄▄▄▄▄ ███
███ █   █ █▀▀▀█ ▀ ▀█ █   █ ███
███ █▄▄▄█ █▀ █▀▀█ ██ █▄▄▄█ ███
...

========================================
Scan QR code above with WhatsApp
========================================
```

**📱 Cara Scan:**
1. Buka WhatsApp di HP
2. Tap menu (3 titik) → Linked Devices
3. Tap "Link a Device"
4. Scan QR code di terminal

---

### 5️⃣ Verify Service Running

```bash
# Check status
pm2 status

# Should show:
# ┌─────┬────────────────────┬─────────┬─────────┬─────────┬──────────┐
# │ id  │ name               │ status  │ restart │ uptime  │ cpu      │
# ├─────┼────────────────────┼─────────┼─────────┼─────────┼──────────┤
# │ 0   │ whatsapp-service   │ online  │ 0       │ 5s      │ 0%       │
# └─────┴────────────────────┴─────────┴─────────┴─────────┴──────────┘

# Test health endpoint
curl http://localhost:3001/health

# Should return:
# {
#   "status": "ok",
#   "service": "WhatsApp Service",
#   "whatsappReady": true,
#   "timestamp": "2026-01-20T03:35:00.000Z"
# }
```

---

### 6️⃣ Test dari Internet

```bash
# Di local machine
curl http://76.13.20.234:3001/health
```

**Jika gagal**, buka firewall:
```bash
# Di VPS
sudo ufw allow 3001/tcp
sudo ufw reload
```

---

### 7️⃣ Update Vercel Environment Variable

1. Go to: https://vercel.com/dashboard
2. Select project: **productivity-tracker**
3. Settings → Environment Variables
4. Add new variable:
   - **Name:** `VITE_WA_SERVICE_URL`
   - **Value:** `http://76.13.20.234:3001/api`
   - **Environment:** Production, Preview, Development
5. Click **Save**
6. Go to **Deployments** → Click **...** → **Redeploy**

---

### 8️⃣ Test WhatsApp Notification

1. Buka dashboard: https://productivity-tracker-fawn.vercel.app
2. Go to **Laporan Langsung**
3. Klik **Kirim** pada salah satu laporan
4. Pilih platform **WhatsApp**
5. Pilih grup tujuan
6. Klik **Kirim ke WhatsApp**

**Expected:** Pesan terkirim ke grup WhatsApp ✅

---

## 🔧 Troubleshooting

### QR Code tidak muncul
```bash
pm2 restart whatsapp-service
pm2 logs whatsapp-service --lines 100
```

### Service tidak bisa diakses dari internet
```bash
# Check firewall
sudo ufw status

# Allow port
sudo ufw allow 3001/tcp
sudo ufw reload

# Check if service listening
netstat -tlnp | grep 3001
```

### WhatsApp disconnected
```bash
# Hapus session dan restart
rm -rf /opt/whatsapp-service/wa-session
pm2 restart whatsapp-service
# Scan QR code lagi
```

### Check logs
```bash
# Real-time logs
pm2 logs whatsapp-service

# Error logs only
pm2 logs whatsapp-service --err

# Last 100 lines
pm2 logs whatsapp-service --lines 100
```

---

## 📊 Useful Commands

```bash
# View logs
pm2 logs whatsapp-service

# Restart
pm2 restart whatsapp-service

# Stop
pm2 stop whatsapp-service

# Start
pm2 start whatsapp-service

# Status
pm2 status

# Monitor (real-time)
pm2 monit

# Save current state
pm2 save
```

---

## ✅ Verification Checklist

- [ ] Files uploaded to VPS
- [ ] Deploy script executed successfully
- [ ] PM2 service running (status: online)
- [ ] QR code scanned with WhatsApp
- [ ] WhatsApp status: ready
- [ ] Health endpoint accessible from internet
- [ ] Firewall port 3001 opened
- [ ] Vercel environment variable added
- [ ] Vercel redeployed
- [ ] Test send message successful

---

## 🎯 Quick Test Commands

```bash
# On VPS
curl http://localhost:3001/health
curl http://localhost:3001/api/wa-status

# From local machine
curl http://76.13.20.234:3001/health
curl http://76.13.20.234:3001/api/wa-status
```

**Expected Response:**
```json
{
  "ready": true,
  "message": "WhatsApp client is ready"
}
```

---

## 📞 Support

Jika ada masalah, check:
1. PM2 logs: `pm2 logs whatsapp-service`
2. Service status: `pm2 status`
3. Firewall: `sudo ufw status`
4. Port listening: `netstat -tlnp | grep 3001`

---

**Ready to deploy? Start with Step 1! 🚀**
