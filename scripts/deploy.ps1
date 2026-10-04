# Автодеплой на сервере: подтягивает main с GitHub, пересобирает и перезапускает сайт.
# Запускается планировщиком Windows каждые пару минут; если новых коммитов нет — сразу выходит.
# Ручной запуск с пересборкой без новых коммитов: deploy.ps1 -Force
param([switch]$Force)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root

# Планировщик запускает скрипт от SYSTEM, а папка принадлежит Administrator —
# без этого git откажется работать с «чужим» репозиторием.
$env:GIT_CONFIG_COUNT = '1'
$env:GIT_CONFIG_KEY_0 = 'safe.directory'
$env:GIT_CONFIG_VALUE_0 = '*'

$logDir = Join-Path $root 'logs'
New-Item -ItemType Directory -Force $logDir | Out-Null
$log = Join-Path $logDir 'deploy.log'
function Log($msg) { "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') $msg" | Out-File $log -Append -Encoding utf8 }

# Не даём двум деплоям идти одновременно.
$lock = Join-Path $logDir 'deploy.lock'
if ((Test-Path $lock) -and ((Get-Item $lock).LastWriteTime -gt (Get-Date).AddMinutes(-20))) { exit 0 }
Set-Content $lock $PID

function Run($label, [scriptblock]$cmd) {
  # git и npm пишут прогресс в stderr — при 'Stop' PowerShell 5.1 счёл бы это ошибкой.
  $ErrorActionPreference = 'Continue'
  & $cmd 2>&1 | ForEach-Object { "$_" } | Out-File $log -Append -Encoding utf8
  if ($LASTEXITCODE -ne 0) { throw "$label failed with exit code $LASTEXITCODE" }
}

# Последний успешно выложенный коммит. Сравниваем с ним, а не с HEAD,
# чтобы упавший деплой повторился при следующем запуске.
$marker = Join-Path $logDir 'deployed-commit'

try {
  Run 'git fetch' { git fetch origin main --quiet }
  $remote = git rev-parse origin/main
  $deployed = if (Test-Path $marker) { (Get-Content $marker -Raw).Trim() } else { '' }
  if ($deployed -eq $remote -and -not $Force) { return }

  Log "deploy $deployed -> $remote"
  $lockBefore = (Get-FileHash package-lock.json).Hash
  Run 'git merge' { git merge --ff-only origin/main }

  $ErrorActionPreference = 'Continue'
  pm2 describe affilki *> $null
  $running = $LASTEXITCODE -eq 0
  $ErrorActionPreference = 'Stop'

  # Зависимости переставляем, только если они изменились: на Windows npm не может
  # удалить файлы работающего процесса, поэтому на это время сайт останавливается.
  $depsChanged = (Get-FileHash package-lock.json).Hash -ne $lockBefore
  if ($depsChanged -or -not (Test-Path node_modules\next\package.json)) {
    if ($running) { Run 'pm2 stop' { pm2 stop affilki } }
    Run 'npm ci' { npm ci --no-audit --no-fund }
  }
  Run 'build' { npm run build }

  # delete + start, а не restart: так подхватываются изменения в ecosystem.config.cjs.
  if ($running) { Run 'pm2 delete' { pm2 delete affilki } }
  Run 'pm2 start' { pm2 start ecosystem.config.cjs }
  Run 'pm2 save' { pm2 save }

  Set-Content $marker $remote
  Log "deployed $remote"
} catch {
  Log "ERROR: $_"
  exit 1
} finally {
  Remove-Item $lock -ErrorAction SilentlyContinue
}
