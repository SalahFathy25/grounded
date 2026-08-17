# Grounded - run backend locally + expose it via a public Cloudflare Tunnel URL
# Usage:  .\run-backend-tunnel.ps1        (or: powershell -ExecutionPolicy Bypass -File .\run-backend-tunnel.ps1)
# Requirements: Node.js 18+ (node on PATH), cloudflared (winget install --id Cloudflare.cloudflared)

$ErrorActionPreference = 'Stop'
$repo = $PSScriptRoot
if (-not $repo) { $repo = (Get-Location).Path }

# 1) Load variables from local.env (KEY=VALUE lines)
$envFile = Join-Path $repo 'local.env'
if (-not (Test-Path $envFile)) {
    Write-Host "Missing local.env - create it from credentials.local.txt (see DEPLOY-TUNNEL.md)." -ForegroundColor Red
    exit 1
}
Get-Content $envFile | ForEach-Object {
    if ($_ -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$') {
        [Environment]::SetEnvironmentVariable($Matches[1], $Matches[2], 'Process')
    }
}

# 2) Is the backend already running on 8080?
$health = 'http://localhost:8080/api/v1/settings'
$backend = $null
$alreadyUp = $false
try {
    Invoke-WebRequest -Uri $health -UseBasicParsing -TimeoutSec 3 | Out-Null
    $alreadyUp = $true
    Write-Host "Backend already running on :8080 - reusing it." -ForegroundColor Green
} catch {
    $alreadyUp = $false
}

if (-not $alreadyUp) {
    $node = Get-Command node -ErrorAction SilentlyContinue
    if (-not $node) {
        Write-Host "Node.js not found. Install it from https://nodejs.org and re-open this window." -ForegroundColor Red
        exit 1
    }
    $backendDir = Join-Path $repo 'backend'
    if (-not (Test-Path (Join-Path $backendDir 'node_modules'))) {
        Write-Host "Installing backend dependencies (first run)..." -ForegroundColor Cyan
        Push-Location $backendDir
        try { npm install --no-fund --no-audit } finally { Pop-Location }
    }
    Write-Host "Starting backend in a new cmd window (SQLite by default, or Neon when DB_URL is set)..." -ForegroundColor Cyan
    $backend = Start-Process -FilePath 'cmd.exe' -ArgumentList '/k', "cd /d `"$backendDir`" && node src/index.js" -PassThru

    Write-Host "Waiting for the backend to answer on :8080 (may take 1-2 min first time)..." -ForegroundColor Cyan
    $ready = $false
    for ($i = 0; $i -lt 60; $i++) {
        if ($backend.HasExited) { break }
        try {
            Invoke-WebRequest -Uri $health -UseBasicParsing -TimeoutSec 3 | Out-Null
            $ready = $true
            break
        } catch {
            Start-Sleep -Seconds 3
        }
    }
    if (-not $ready) {
        Write-Host "Backend did not come up in time. Check the cmd window for errors (bad DB_URL / port 8080 busy)." -ForegroundColor Red
        exit 1
    }
}

$tunnel = $null
try {
    # 3) Start cloudflared (quick tunnel)
    $cf = Get-Command cloudflared -ErrorAction SilentlyContinue
    if (-not $cf) {
        $cfPath = 'C:\Users\DELL\cloudflared\cloudflared.exe'
        if (Test-Path $cfPath) { $cf = Get-Item $cfPath }
    }
    if (-not $cf) {
        Write-Host @"
cloudflared not found. Install it, e.g.:
    winget install --id Cloudflare.cloudflared
or download cloudflared-windows-amd64.exe from https://github.com/cloudflare/cloudflared/releases
After install, close this window and run the script again.
"@ -ForegroundColor Yellow
        exit 1
    }

    $log = Join-Path $env:TEMP 'grounded-tunnel.log'
    $logErr = "$log.err"
    Write-Host "Starting Cloudflare Tunnel..." -ForegroundColor Cyan
    $tunnel = Start-Process -FilePath $cf.Source -ArgumentList 'tunnel', '--url', 'http://localhost:8080' -RedirectStandardOutput $log -RedirectStandardError $logErr -PassThru

    # 4) Poll the tunnel log for the public URL
    $url = $null
    for ($i = 0; $i -lt 30; $i++) {
        if ($tunnel.HasExited) { break }
        $out = Get-Content $log -Raw -ErrorAction SilentlyContinue
        if ($out -match 'https://[a-z0-9\-]+\.trycloudflare\.com') { $url = $Matches[0]; break }
        Start-Sleep -Seconds 1
    }

    if ($url) {
        $urlFile = Join-Path $repo 'tunnel-url.txt'
        Set-Content -Path $urlFile -Value $url -Encoding Ascii
        Write-Host ""
        Write-Host "========== STORE IS LIVE ==========" -ForegroundColor Green
        Write-Host "API base:    $url/api/v1" -ForegroundColor Green
        Write-Host "Test it:     $url/api/v1/settings" -ForegroundColor Green
        Write-Host "Saved to:    $urlFile" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next: point the Vercel frontend at this URL (VITE_API_URL=$url/api/v1)."  -ForegroundColor Cyan
        Write-Host "Attention: URL changes every time this script restarts - re-update Vercel then."  -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Keep this window open. Press Ctrl+C to stop the tunnel." -ForegroundColor Cyan
    } else {
        Write-Host "Could not read the tunnel URL from cloudflared output. Log: $log / $logErr" -ForegroundColor Red
    }

    # 5) Keep running until the user stops it (or cloudflared dies)
    Wait-Process -Id $tunnel.Id
} finally {
    if ($tunnel -and -not $tunnel.HasExited) {
        try { Stop-Process -Id $tunnel.Id -Force -ErrorAction SilentlyContinue } catch { }
    }
    if ($backend -and -not $backend.HasExited) {
        Write-Host "Stopping the backend window too (close it manually if it stays open)." -ForegroundColor Yellow
        try { Stop-Process -Id $backend.Id -Force -ErrorAction SilentlyContinue } catch { }
    }
}