// Админка живёт по неочевидному адресу из env; внутри проекта её страницы лежат в app/admin-internal,
// куда снаружи попасть нельзя (proxy.ts отдаёт 404).
export const ADMIN_PATH = (process.env.ADMIN_PATH ?? "/ctrl-dev").replace(/\/+$/, "");
export const ADMIN_INTERNAL = "/admin-internal";

/** Ссылка внутри админки: adminUrl("/votes") → "/ctrl-xxxx/votes". */
export const adminUrl = (path = "") => `${ADMIN_PATH}${path}`;
