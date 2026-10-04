// pm2: прод-процесс сайта на сервере. Порт 3010 — чтобы не пересекаться с соседними проектами.
module.exports = {
  apps: [
    {
      name: "affilki",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3010",
      env: { NODE_ENV: "production" },
    },
  ],
};
