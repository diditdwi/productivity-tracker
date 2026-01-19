#!/bin/bash

# 1. Update Internal System
echo "Updating System..."
sudo apt-get update && sudo apt-get upgrade -y

# 2. Install Node.js (Version 20)
echo "Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Install Git & PM2
echo "Installing Git and PM2..."
sudo apt-get install -y git
sudo npm install -g pm2

# 4. Install Libraries for Puppeteer (Chrome) - CRITICAL for WA Bot
echo "Installing Chrome Dependencies..."
sudo apt-get install -y ca-certificates fonts-liberation libappindicator3-1 libasound2 libatk-bridge2.0-0 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc1 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 lsb-release wget xdg-utils

# 5. Create Project Directory
echo "Setting up Project Directory..."
mkdir -p ~/productivity-tracker
cd ~/productivity-tracker

echo "======================================="
echo "SETUP COMPLETE!"
echo "Now you can upload your code here."
echo "======================================="
