// pm2: прод-процесс сайта на сервере. Порт 3010 — чтобы не пересекаться с соседними проектами.
module.exports = {
  apps: [
    {
      name: "affilki",
      script: "scripts/start.cjs",
      env: { NODE_ENV: "production", PORT: "3010" },
    },
  ],
};
