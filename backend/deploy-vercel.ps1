# Deploys the backend to Vercel using the Build Output API with explicit routes.
# Run from the REPO ROOT. Requires `vercel` CLI installed and logged in.
$ErrorActionPreference = 'Stop'

$out = Join-Path (Get-Location) '.vercel\output'
$funcSrc = Join-Path $out 'functions\api\index.js.func'
$funcDst = Join-Path $out 'functions\api.func'

vercel link --yes --project grounded_backend | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'vercel link failed' }

vercel pull --yes --environment production | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'vercel pull failed' }

Remove-Item -Path (Join-Path (Get-Location) '.vercel\.env.preview.local') -Force -ErrorAction SilentlyContinue
Remove-Item -Path $out -Recurse -Force -ErrorAction SilentlyContinue

vercel build --yes
if ($LASTEXITCODE -ne 0) { throw 'vercel build failed' }

if (Test-Path $funcSrc) {
  Move-Item $funcSrc $funcDst -Force
  $parent = Split-Path $funcSrc
  if (Test-Path $parent) { Remove-Item $parent -Recurse -Force }
}

$configPath = Join-Path $out 'config.json'
@'
{
  "version": 3,
  "routes": [
    { "src": "/api(?:/(.*))?", "dest": "/api" }
  ],
  "crons": []
}
'@ | Set-Content $configPath -Encoding utf8

$buildsPath = Join-Path $out 'builds.json'
if (Test-Path $buildsPath) {
  (Get-Content $buildsPath -Raw).Replace('"target": "preview"', '"target": "production"') | Set-Content $buildsPath -NoNewline
}

Write-Host 'Uploading to Vercel...'
vercel deploy --prebuilt --prod --yes
if ($LASTEXITCODE -ne 0) { throw 'vercel deploy failed' }
Write-Host 'Done.'