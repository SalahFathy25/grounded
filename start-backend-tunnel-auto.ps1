# Grounded - auto-restore backend + Cloudflare tunnel at Windows logon
# Registered as scheduled task 'grounded-auto' (schtasks /sc onlogon)
$ErrorActionPreference = 'Continue'
$repo = 'E:\e_commerce'
$java = 'C:\Program Files\Eclipse Adoptium\jdk-17.0.16.8-hotspot\bin\java.exe'
$cf = 'C:\Users\DELL\cloudflared\cloudflared.exe'
$logDir = 'C:\Users\DELL\AppData\Local\Temp\opencode'
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'

# 1) Backend: start only if nothing is answering on 8080
$up = $false
try { Invoke-WebRequest 'http://localhost:8080/api/v1/settings' -UseBasicParsing -TimeoutSec 3 | Out-Null; $up = $true } catch { }
if (-not $up) {
    Get-Content "$repo\local.env" | ForEach-Object {
        if ($_ -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$') {
            [Environment]::SetEnvironmentVariable($Matches[1], $Matches[2], 'Process')
        }
    }
    Start-Process $java -ArgumentList '-jar', "$repo\backend\target\shopverse-api-0.1.0.jar" `
        -WindowStyle Hidden `
        -RedirectStandardOutput "$logDir\backend-$stamp.log" `
        -RedirectStandardError "$logDir\backend-$stamp.err.log" | Out-Null
    for ($i = 0; $i -lt 90; $i++) {
        try { Invoke-WebRequest 'http://localhost:8080/api/v1/settings' -UseBasicParsing -TimeoutSec 3 | Out-Null; break } catch { Start-Sleep -Seconds 2 }
    }
}

# 2) Tunnel: start only if the saved URL is dead (a new quick tunnel URL is random)
$needTunnel = $true
if (Test-Path "$repo\tunnel-url.txt") {
    $old = (Get-Content "$repo\tunnel-url.txt").Trim()
    if ($old) {
        try { Invoke-WebRequest "$old/api/v1/settings" -UseBasicParsing -TimeoutSec 8 | Out-Null; $needTunnel = $false } catch { }
    }
}
if ($needTunnel) {
    $log = "$logDir\tunnel-$stamp.log"
    Start-Process $cf -ArgumentList 'tunnel', '--url', 'http://localhost:8080' `
        -WindowStyle Hidden `
        -RedirectStandardOutput $log `
        -RedirectStandardError "$log.err" | Out-Null
    for ($i = 0; $i -lt 40; $i++) {
        $o = Get-Content $log -Raw -ErrorAction SilentlyContinue
        if ($o -match 'https://[a-z0-9\-]+\.trycloudflare\.com') {
            Set-Content "$repo\tunnel-url.txt" $Matches[0] -Encoding Ascii
            break
        }
        Start-Sleep -Seconds 1
    }
}