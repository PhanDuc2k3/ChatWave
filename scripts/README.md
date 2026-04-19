# Nginx + SSL for ChatWave

## Database Migrations

### Role Simplification Migration (v2.0)

Chuyển role từ 3 roles (owner/admin/member) → 2 roles (leader/member):

```bash
cd D:\ChatWave
node scripts/migrations/role-simplify.js
```

**Backup trước khi chạy:**
```bash
mongodump --uri="mongodb://localhost:27017/chatwave" --out=backup/$(date +%Y%m%d_%H%M%S)
```

**Migration rules:**
- `owner` → `leader` (1 leader/nhóm)
- `admin` → `member`
- `member` → `member` (giữ nguyên)

**Sau migration:**
- Leader có thể chuyển giao quyền cho member khác
- Chỉ leader được phân tích AI cho nhóm >2 người
- Leader có thể thêm/xóa member, đổi role

## Option 1: One-command deploy (PowerShell)

```powershell
cd D:\ChatWave\scripts
copy .env.example .env
# Edit .env: VPS_HOST, VPS_PASSWORD
.\deploy-nginx-ssl.ps1
```

## Option 2: Manual run on VPS

1. Copy scripts to VPS:
   ```powershell
   scp -r D:\ChatWave\scripts root@<IP_VPS>:/root/
   ```

2. SSH into VPS and run:
   ```bash
   ssh root@<IP_VPS>
   cd /root/scripts
   chmod +x setup-nginx-ssl.sh
   sudo bash setup-nginx-ssl.sh
   ```

## Before running

Point DNS A records to your VPS IP:

| Subdomain | Type | Value   |
|-----------|------|---------|
| api       | A    | IP_VPS  |
| ws        | A    | IP_VPS  |
| chatbot   | A    | IP_VPS  |

## After setup

Update frontend `.env` and Vercel:

```
VITE_API_BASE_URL=https://api.chatwave.site/api/v1
VITE_REALTIME_URL=https://ws.chatwave.site
VITE_CHATBOT_API_URL=https://chatbot.chatwave.site/api/v1
```
