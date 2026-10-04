// Точка входа для pm2 на Windows: файл next без расширения pm2 там не запускает.
process.argv.splice(2, 0, "start", "-p", process.env.PORT || "3010");
// eslint-disable-next-line @typescript-eslint/no-require-imports
require("next/dist/bin/next");
