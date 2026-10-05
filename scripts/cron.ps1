# Обёртка для планировщика Windows: запускает фоновую задачу сайта и пишет её вывод в logs\cron.log.
#   cron.ps1 nightly   — агрегаты, чистка старых событий, обезличивание
#   cron.ps1 geoip     — обновление базы «IP → страна»
param([Parameter(Mandatory = $true)][string]$Task)

$ErrorActionPreference = 'Continue'
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root
New-Item -ItemType Directory -Force (Join-Path $root 'logs') | Out-Null
$log = Join-Path $root 'logs\cron.log'

"$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') start $Task" | Out-File $log -Append -Encoding utf8
npx --no-install tsx scripts/cron.ts $Task 2>&1 | ForEach-Object { "$_" } | Out-File $log -Append -Encoding utf8
"$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') done $Task (exit $LASTEXITCODE)" | Out-File $log -Append -Encoding utf8
exit $LASTEXITCODE
