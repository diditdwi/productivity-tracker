#!/bin/bash

# WhatsApp Service Deployment Script for VPS
# Usage: ./deploy.sh

set -e

echo "=========================================="
echo "WhatsApp Service Deployment"
echo "=========================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
SERVICE_DIR="/opt/whatsapp-service"
SERVICE_USER="whatsapp"

echo -e "${YELLOW}Step 1: Checking prerequisites...${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root (use sudo)${NC}"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}Node.js not found. Installing Node.js 18.x...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi

echo -e "${GREEN}✓ Node.js version: $(node -v)${NC}"
echo -e "${GREEN}✓ NPM version: $(npm -v)${NC}"

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}PM2 not found. Installing PM2...${NC}"
    npm install -g pm2
fi

echo -e "${GREEN}✓ PM2 installed${NC}"

echo -e "\n${YELLOW}Step 2: Setting up service directory...${NC}"

# Create service directory
mkdir -p $SERVICE_DIR
mkdir -p $SERVICE_DIR/logs
mkdir -p $SERVICE_DIR/wa-session

# Copy files
echo -e "${YELLOW}Copying service files...${NC}"
cp server.js $SERVICE_DIR/
cp package.json $SERVICE_DIR/
cp ecosystem.config.js $SERVICE_DIR/

cd $SERVICE_DIR

echo -e "\n${YELLOW}Step 3: Installing dependencies...${NC}"
npm install --production

echo -e "\n${YELLOW}Step 4: Setting up PM2...${NC}"

# Stop existing service if running
pm2 stop whatsapp-service 2>/dev/null || true
pm2 delete whatsapp-service 2>/dev/null || true

# Start service
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup systemd -u root --hp /root

echo -e "\n${YELLOW}Step 5: Setting up firewall...${NC}"

# Allow port 3001
if command -v ufw &> /dev/null; then
    ufw allow 3001/tcp
    echo -e "${GREEN}✓ Firewall rule added for port 3001${NC}"
fi

echo -e "\n${GREEN}=========================================="
echo -e "✅ Deployment Complete!"
echo -e "==========================================${NC}"
echo ""
echo -e "${YELLOW}Service Information:${NC}"
echo -e "  Service Directory: $SERVICE_DIR"
echo -e "  Port: 3001"
echo -e "  Health Check: http://YOUR_VPS_IP:3001/health"
echo ""
echo -e "${YELLOW}Useful Commands:${NC}"
echo -e "  View logs:    ${GREEN}pm2 logs whatsapp-service${NC}"
echo -e "  Restart:      ${GREEN}pm2 restart whatsapp-service${NC}"
echo -e "  Stop:         ${GREEN}pm2 stop whatsapp-service${NC}"
echo -e "  Status:       ${GREEN}pm2 status${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo -e "  1. Check logs: ${GREEN}pm2 logs whatsapp-service${NC}"
echo -e "  2. Scan QR code with WhatsApp"
echo -e "  3. Update frontend to use: ${GREEN}http://YOUR_VPS_IP:3001${NC}"
echo ""
