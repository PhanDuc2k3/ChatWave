#!/bin/bash
# Chạy script này TRÊN VPS (sau khi đã upload code)
# Usage: bash setup-vps.sh

set -e
cd "$(dirname "$0")"

echo "===> Cài Node.js 20..."
if ! command -v node &>/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
node -v

echo "===> Cài dependencies..."
npm install --production

echo "===> Kiểm tra .env..."
if [ ! -f .env ]; then
  echo "Chưa có .env! Tạo file .env với PORT và ANTHROPIC_API_KEY"
  echo "PORT=5003" > .env
  echo "ANTHROPIC_API_KEY=YOUR_KEY_HERE" >> .env
  echo "Vui lòng sửa .env và thêm ANTHROPIC_API_KEY thật"
  exit 1
fi

echo "===> Cài PM2 (global)..."
npm install -g pm2 2>/dev/null || true

echo "===> Khởi động với PM2..."
pm2 delete chatbot 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
pm2 startup 2>/dev/null || echo "Chạy lệnh pm2 startup được in ra để auto-start khi reboot"

echo "===> Done! Chatbot chạy tại port 5003"
pm2 status
