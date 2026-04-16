# Deploy chatbot-service lên VPS
# Chạy: .\deploy.ps1
# Đặt VPS_HOST, VPS_USER, VPS_PASSWORD trong .env để không cần nhập password
# Lưu ý: Project này dùng ANTHROPIC_API_KEY (không phải GROQ)

param(
    [Parameter(Mandatory=$false)]
    [string]$ServerHost,
    [Parameter(Mandatory=$false)]
    [string]$User,
    [Parameter(Mandatory=$false)]
    [string]$RemotePath = "/opt/chatbot-service"
)

$LocalPath = $PSScriptRoot

# Load .env
if (Test-Path "$LocalPath\.env") {
    Get-Content "$LocalPath\.env" | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $val = $matches[2].Trim().Trim('"').Trim("'")
            Set-Item -Path "Env:$key" -Value $val -Force
        }
    }
}

$ServerHost = if ($ServerHost) { $ServerHost } elseif ($env:VPS_HOST) { $env:VPS_HOST } else { "157.10.195.4" }
$User = if ($User) { $User } elseif ($env:VPS_USER) { $env:VPS_USER } else { "root" }
$pass = $env:VPS_PASSWORD
$dest = "${User}@${ServerHost}:$RemotePath"

function Run-Scp {
    if ($pass) {
        $sshpass = "sshpass" 2>$null
        if (Get-Command sshpass -ErrorAction SilentlyContinue) {
            $env:SSHPASS = $pass
            sshpass -e scp @args
        } elseif (Get-Command pscp -ErrorAction SilentlyContinue) {
            pscp -batch -pw $pass @args
        } elseif (Test-Path "C:\Program Files\Git\usr\bin\sshpass.exe") {
            $env:SSHPASS = $pass
            & "C:\Program Files\Git\usr\bin\sshpass.exe" -e scp @args
        } else {
            Write-Host "Để dùng password từ .env: cài sshpass (scoop install sshpass) hoặc PuTTY" -ForegroundColor Yellow
            scp @args
        }
    } else {
        scp @args
    }
}

function Run-Ssh {
    param([string]$Cmd)
    if ($pass) {
        if (Get-Command sshpass -ErrorAction SilentlyContinue) {
            $env:SSHPASS = $pass
            sshpass -e ssh -o StrictHostKeyChecking=no "${User}@${ServerHost}" $Cmd
        } elseif (Get-Command plink -ErrorAction SilentlyContinue) {
            echo y | plink -batch -ssh -pw $pass "${User}@${ServerHost}" $Cmd
        } elseif (Test-Path "C:\Program Files\Git\usr\bin\sshpass.exe") {
            $env:SSHPASS = $pass
            & "C:\Program Files\Git\usr\bin\sshpass.exe" -e ssh -o StrictHostKeyChecking=no "${User}@${ServerHost}" $Cmd
        } else {
            ssh -o StrictHostKeyChecking=no "${User}@${ServerHost}" $Cmd
        }
    } else {
        ssh -o StrictHostKeyChecking=no "${User}@${ServerHost}" $Cmd
    }
}

Write-Host "===> Deploy chatbot-service to $User@${ServerHost}:$RemotePath" -ForegroundColor Cyan
if ($pass) { Write-Host "     (dùng password từ .env)" -ForegroundColor Gray }
Write-Host ""

Write-Host "⚠️  Lưu ý: IP server mới là 157.10.195.4" -ForegroundColor Yellow
Write-Host ""

Run-Ssh -Cmd "mkdir -p $RemotePath"

Write-Host "===> Upload files..." -ForegroundColor Yellow
Run-Scp -r -o StrictHostKeyChecking=no "$LocalPath\src" $dest/
Run-Scp -o StrictHostKeyChecking=no "$LocalPath\package.json", "$LocalPath\ecosystem.config.js", "$LocalPath\setup-vps.sh" $dest/

if (Test-Path "$LocalPath\.env") {
    Run-Scp "$LocalPath\.env" $dest/
}

Write-Host "===> Chạy setup trên VPS..." -ForegroundColor Yellow
Run-Ssh -Cmd "cd $RemotePath && tr -d '\015' < setup-vps.sh > setup-vps.tmp && mv setup-vps.tmp setup-vps.sh && chmod +x setup-vps.sh && bash setup-vps.sh"

Write-Host ""
Write-Host "===> Deploy xong! Chatbot API: http://${ServerHost}:5003/api/v1" -ForegroundColor Green
Write-Host "Cập nhật frontend: VITE_CHATBOT_API_URL=http://${ServerHost}:5003/api/v1" -ForegroundColor Cyan
