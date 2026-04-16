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
  echo "Chưa có .env! Tạo file .env với MONGODB_URI, PORT, JWT_SECRET, CLOUDINARY_*"
  echo "PORT=5001" > .env
  echo "MONGODB_URI=mongodb://127.0.0.1:27017/chatwave" >> .env
  echo "JWT_SECRET=change-me-in-production" >> .env
  echo "Vui lòng sửa .env và thêm giá trị thật"
  exit 1
fi

echo "===> Cài PM2 (global)..."
npm install -g pm2 2>/dev/null || true

echo "===> Khởi động với PM2..."
pm2 delete core 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
pm2 startup 2>/dev/null || echo "Chạy lệnh pm2 startup được in ra để auto-start khi reboot"

echo "===> Done! Core API chạy tại port 5001"
pm2 status
