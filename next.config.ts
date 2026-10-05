import type { NextConfig } from "next";

// Заголовки безопасности для всех ответов. CSP с nonce добавляется отдельно (Фаза G).
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Картинки до 10 МБ, в форме рекламы их две: поднимаем лимиты тела запроса
  // и для серверных действий (по умолчанию 1 МБ), и для прокси (по умолчанию 10 МБ).
  experimental: { serverActions: { bodySizeLimit: "25mb" }, proxyClientMaxBodySize: "25mb" },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
