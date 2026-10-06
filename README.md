# AFFILKI

Сайт премии AFFILKI Awards и медиа для арбитражного комьюнити: номинации и голосование, лента статей, заявки на публикацию, реклама, админ-панель.

Next.js (App Router) · TypeScript · Tailwind · Prisma · PostgreSQL · Telegram Bot API · Cloudflare Turnstile.

## Локальный запуск

Нужны Node.js 24.7+ и PostgreSQL 15+.

```bash
npm install
cp .env.example .env        # заполнить DATABASE_URL, остальное — по разделу ниже
createdb affilki_dev
npx prisma migrate deploy   # применить миграции
npm run db:seed             # сезон, 9 номинаций с тестовыми участниками, статьи-заглушки
npm run dev                 # http://localhost:3000
```

Сиды только заполняют пустую базу и ничего не перезаписывают.

### Вход без настоящего бота

Webhook Telegram до `localhost` не достаёт. Для разработки в `.env` ставится `DEV_FAKE_BOT=true`:

- в диалоге входа появляется кнопка «Dev: пройти бота» — она проходит шаги бота тестовым аккаунтом;
- Telegram-клиент ничего не отправляет, поэтому локальные прогоны не пишут настоящим людям;
- капча работает на тестовых ключах Cloudflare (`1x00000000000000000000AA` / `1x0000000000000000000000000000000AA`).

В production-сборке этот режим отключён: `/api/dev/bot` отдаёт 404.

### Тесты и проверки

```bash
createdb affilki_test
DATABASE_URL=postgresql://$USER@localhost:5432/affilki_test npx prisma migrate deploy
npm test          # голосование, вход, live-табло, аналитика, шифрование, разметка, права админки
npm run lint
npx tsc --noEmit
```

## Переменные окружения

| Переменная | Зачем |
|---|---|
| `DATABASE_URL` | строка подключения к PostgreSQL |
| `NEXT_PUBLIC_SITE_URL` | адрес сайта (`https://affilki.com`) — для ссылок в боте и OG-картинок |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME` | бот: вход, квитанции о голосах, уведомления |
| `TELEGRAM_WEBHOOK_SECRET` | секрет, с которым Telegram обращается к `/api/tg/webhook` |
| `TELEGRAM_CHANNEL_ID`, `TG_CHANNEL_URL` | канал: проверка подписки и ссылки на сайте |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET` | капча Cloudflare Turnstile |
| `SESSION_SECRET` | подпись служебных cookie |
| `IP_HASH_SALT` | соль для хэшей IP и браузера (сами значения не хранятся) |
| `OWNER_TG_ID` | Telegram ID владельца: первый вход создаёт его админом, сюда же идут уведомления |
| `ADMIN_PATH` | адрес админки, например `/ctrl-8f3k2` |
| `ADMIN_ENC_KEY` | ключ шифрования секретов двухфакторного входа (32+ символа) |
| `ADMIN_IP_ALLOWLIST` | необязательно: IP через запятую, с которых открывается админка |
| `ADS_CONTACT_URL` | куда ведёт заглушка «Слот свободен» |

Все секреты — только в `.env` на сервере. `.env` в git не попадает.

## Как устроено

- **Данные публичной части** идут через `lib/data`. Страницы в базу напрямую не ходят.
- **Вход** — один раз через бота: сайт выдаёт одноразовую ссылку, человек подтверждает вход кнопкой в Telegram. Логика в `lib/voting/login.ts`.
- **Голос** (`lib/voting/vote.ts`) проверяется на сервере: окно дат, бан, пороги аккаунта, подписка на канал, капча. Один аккаунт — один голос в номинации; это гарантирует уникальный индекс в базе.
- **Live-табло** (`lib/live`) — агрегированный снимок по Server-Sent Events. До старта, при заморозке и ниже порога голосов наружу уходит только общее число.
- **Заявки** (`lib/submissions.ts`) — модерация с возвратом на правки и уведомлениями в боте.
- **Текст статей и заявок** — простая разметка (`lib/markup.ts`): ввод экранируется целиком, теги создаёт только рендерер.
- **Аналитика** (`lib/analytics`) — свои события без сторонних трекеров; IP не хранится.
- **Админка** лежит в `app/admin-internal`, а открывается по `ADMIN_PATH` через `proxy.ts`. Вход — бот плюс TOTP. Права проверяются в каждой странице и каждом действии (`lib/admin/auth.ts`), все изменения пишутся в журнал.

## Деплой

Сайт работает на Windows Server под pm2 за Caddy.

1. Клонировать репозиторий, создать `.env`, выполнить `npm ci`, `npx prisma migrate deploy`, `npm run db:seed`, `npm run build`.
2. Запустить: `pm2 start ecosystem.config.cjs && pm2 save` (порт 3010).
3. В Caddy: `affilki.com { reverse_proxy localhost:3010 }` — сертификат Caddy выпустит сам.
4. Подключить бота: `setWebhook` на `https://<домен>/api/tg/webhook` с `secret_token` из `TELEGRAM_WEBHOOK_SECRET` и `allowed_updates: ["message", "callback_query"]`. Бот должен быть администратором канала.

Папке проекта нужен доступ на изменение для учётной записи, от которой работает pm2.

### Автообновление

`scripts/deploy.ps1` запускается планировщиком раз в 2 минуты: если в `main` появился коммит — подтягивает его, применяет миграции, пересобирает и перезапускает сайт. При смене зависимостей или схемы базы сайт останавливается на время установки (ограничение Windows: нельзя перезаписать файлы работающего процесса). Лог — `logs/deploy.log`.

### Фоновые задачи

| Задача | Когда | Что делает |
|---|---|---|
| `scripts/cron.ps1 nightly` | ежедневно | суточные агрегаты статистики; удаление событий старше 180 дней, отработавших ссылок входа и старых админ-сессий; через 90 дней после сезона Telegram ID голосовавших заменяются хэшем |
| `scripts/cron.ps1 geoip` | раз в 4 недели | обновление локальной базы «IP → страна» (DB-IP Lite) |
| `scripts/backup.ps1` | ежедневно | бэкап базы и загруженных картинок |

## Бэкапы

`scripts/backup.ps1` делает `pg_dump -Fc` в `C:\ProgramData\affilki-backups` (или в `AFFILKI_BACKUP_DIR`), проверяет, что дамп читается, архивирует `data/uploads` и удаляет файлы старше 14 дней. Результат пишется в `backup.log` в той же папке.

Бэкапы лежат на том же сервере, что и база. От поломки диска или потери сервера это не спасает — копию стоит регулярно забирать на другой компьютер или в облако.

### Восстановление

```powershell
# 1. Остановить сайт
pm2 stop affilki

# 2. Восстановить базу из дампа (существующие таблицы будут заменены)
$env:PGPASSWORD = '<пароль из DATABASE_URL>'
& 'C:\Program Files\PostgreSQL\15\bin\pg_restore.exe' -U affilki -h localhost -p 5433 -d affilki --clean --if-exists C:\ProgramData\affilki-backups\affilki-ГГГГММДД-ЧЧММСС.dump

# 3. Вернуть картинки
Expand-Archive C:\ProgramData\affilki-backups\affilki-ГГГГММДД-ЧЧММСС-uploads.zip C:\Users\Administrator\affilki\data\uploads -Force

# 4. Запустить сайт
pm2 start affilki
```

## Безопасность

- Админка: неочевидный адрес (`/admin` отдаёт 404), вход через бота и TOTP, серверные сессии на 8 часов с выходом после 30 минут бездействия и привязкой к браузеру, повторный код на опасные действия, роли, журнал действий без удаления.
- Заголовки: строгий CSP с nonce, HSTS, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, `X-Content-Type-Options`.
- Мутации принимаются только со своего origin; cookie админа — `SameSite=Strict` с префиксом `__Host-`.
- Загрузки: только картинки, тип определяется по сигнатуре файла, SVG запрещён, имена случайные.
- Запросы к базе — только через Prisma с привязанными параметрами.

### Cloudflare Access перед админкой (рекомендуется)

Если домен проксируется через Cloudflare, перед адресом админки можно поставить дополнительную проверку:

1. Zero Trust → Access → Applications → Add an application → Self-hosted.
2. Application domain: `affilki.com`, Path: значение `ADMIN_PATH` без ведущего слэша.
3. Policy: Allow → Emails → адреса админов.

Тогда до страницы входа доберётся только тот, кто подтвердил почту из списка. Альтернатива без Cloudflare — `ADMIN_IP_ALLOWLIST`.
