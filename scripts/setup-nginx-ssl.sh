#!/bin/bash
# Setup Nginx + Let's Encrypt SSL for ChatWave
# Run: sudo bash setup-nginx-ssl.sh
# Requires: DNS A records for api, ws, chatbot.chatwave.site -> VPS IP

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONF="$SCRIPT_DIR/nginx/chatwave.conf"

echo "===> Firewall 80, 443..."
ufw allow 80 2>/dev/null || true
ufw allow 443 2>/dev/null || true
ufw --force enable 2>/dev/null || true

echo "===> Install Nginx + Certbot..."
apt-get update -qq
apt-get install -y nginx certbot python3-certbot-nginx

echo "===> Copy Nginx config..."
cp "$CONF" /etc/nginx/sites-available/chatwave.conf
ln -sf /etc/nginx/sites-available/chatwave.conf /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

echo "===> Test and reload Nginx..."
nginx -t && systemctl reload nginx

echo "===> SSL Let's Encrypt..."
certbot --nginx -d api.chatwave.site -d ws.chatwave.site -d chatbot.chatwave.site \
  --non-interactive --agree-tos --register-unsafely-without-email --redirect

echo ""
echo "===> Done. Update frontend .env and Vercel:"
echo "  VITE_API_BASE_URL=https://api.chatwave.site/api/v1"
echo "  VITE_REALTIME_URL=https://ws.chatwave.site"
echo "  VITE_CHATBOT_API_URL=https://chatbot.chatwave.site/api/v1"
