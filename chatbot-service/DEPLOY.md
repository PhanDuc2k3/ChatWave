# Deploy Chatbot Service lên VPS

## Cách 1: Deploy tự động (PowerShell - Windows)

Thêm vào `.env` (để không phải nhập password mỗi lần):
```
VPS_HOST=157.10.195.4
VPS_USER=root
VPS_PASSWORD=mật_khẩu_ssh_của_vps
```

Cài **sshpass** hoặc **PuTTY** (pscp, plink) để dùng password tự động:
```powershell
scoop install sshpass
```

Chạy:
```powershell
cd d:\ChatWave\chatbot-service
.\deploy.ps1
```

---

## Cách 2: Deploy thủ công

### Bước 1: Upload code lên VPS

Từ máy Windows (PowerShell hoặc CMD):

```bash
scp -r src package.json ecosystem.config.js setup-vps.sh root@157.10.195.4:/opt/chatbot-service/
scp .env root@157.10.195.4:/opt/chatbot-service/
```

*(Nếu chưa có `.env` trên VPS, tạo sau trong Bước 3)*

### Bước 2: SSH vào VPS

```bash
ssh root@157.10.195.4
```

### Bước 3: Trên VPS

```bash
cd /opt/chatbot-service

# Tạo .env nếu chưa có (dùng ANTHROPIC API)
cat > .env << 'EOF'
PORT=5003
ANTHROPIC_API_KEY=sk-ant-your-api-key-here
EOF
# Sửa ANTHROPIC_API_KEY bằng key thật (bắt đầu bằng sk-ant-)

# Chạy setup
chmod +x setup-vps.sh
bash setup-vps.sh
```

### Bước 4: Mở port 5003

Trên dashboard VPS (onet.com.vn), vào **Cài đặt** → **Firewall** và mở port **5003** (TCP).

### Bước 5: Cập nhật Frontend

Trong `.env` của frontend hoặc `chatbotApi.js`:

```
VITE_CHATBOT_API_URL=http://157.10.195.4:5003/api/v1
```

---

## Kiểm tra

- API: `http://157.15.108.181:5003/api/v1/chat/completions`
- Test: `curl -X POST http://157.15.108.181:5003/api/v1/chat/completions -H "Content-Type: application/json" -d '{"messages":[{"role":"user","content":"hi"}]}'`

## Lệnh PM2 hữu ích

```bash
pm2 status        # Xem trạng thái
pm2 logs chatbot  # Xem log
pm2 restart chatbot
pm2 stop chatbot
```
