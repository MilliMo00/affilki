# Ежедневный бэкап базы AFFILKI. Запускается планировщиком Windows.
# Дамп в формате pg_dump -Fc: сжатый, восстанавливается pg_restore (см. README, раздел «Бэкапы»).
# Хранятся последние 14 дней. Каталог можно сменить переменной AFFILKI_BACKUP_DIR.
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$dir = if ($env:AFFILKI_BACKUP_DIR) { $env:AFFILKI_BACKUP_DIR } else { 'C:\ProgramData\affilki-backups' }
New-Item -ItemType Directory -Force $dir | Out-Null
$log = Join-Path $dir 'backup.log'
function Log($msg) { "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') $msg" | Out-File $log -Append -Encoding utf8 }

try {
  $url = (Get-Content (Join-Path $root '.env') | Where-Object { $_ -like 'DATABASE_URL=*' }) -replace '^DATABASE_URL=', ''
  $m = [regex]::Match($url, '^postgres(?:ql)?://([^:]+):([^@]+)@([^:/]+):(\d+)/([^?]+)')
  if (-not $m.Success) { throw 'DATABASE_URL не разобран' }
  $bin = (Get-ChildItem 'C:\Program Files\PostgreSQL\*\bin' -Directory | Sort-Object FullName -Descending | Select-Object -First 1).FullName

  $file = Join-Path $dir ("affilki-{0}.dump" -f (Get-Date -Format 'yyyyMMdd-HHmmss'))
  $env:PGPASSWORD = $m.Groups[2].Value
  & "$bin\pg_dump.exe" -U $m.Groups[1].Value -h $m.Groups[3].Value -p $m.Groups[4].Value -d $m.Groups[5].Value -Fc -f $file
  if ($LASTEXITCODE -ne 0) { throw "pg_dump завершился с кодом $LASTEXITCODE" }
  # Дамп, который не читается, — не бэкап: проверяем оглавление.
  & "$bin\pg_restore.exe" --list $file | Out-Null
  if ($LASTEXITCODE -ne 0) { throw 'дамп не читается pg_restore' }
  $env:PGPASSWORD = ''

  # Вместе с базой — загруженные картинки: без них участники и статьи останутся без фото.
  $uploads = Join-Path $root 'data\uploads'
  if (Test-Path $uploads) {
    Compress-Archive -Path "$uploads\*" -DestinationPath ($file -replace '\.dump$', '-uploads.zip') -Force -ErrorAction SilentlyContinue
  }

  Get-ChildItem $dir -File | Where-Object { $_.Name -like 'affilki-*' -and $_.LastWriteTime -lt (Get-Date).AddDays(-14) } | Remove-Item -Force
  Log "ok $(Split-Path $file -Leaf) $([math]::Round((Get-Item $file).Length / 1KB)) KB"
} catch {
  Log "ERROR: $_"
  exit 1
}
