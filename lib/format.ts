const dateFmt = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", timeZone: "Europe/Moscow" });
const dateYearFmt = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/Moscow",
});
const compactFmt = new Intl.NumberFormat("ru-RU", { notation: "compact", maximumFractionDigits: 1 });

/** «12 декабря»; год добавляется, только если он не текущий. */
export function formatDate(date: Date, now = new Date()) {
  return date.getFullYear() === now.getFullYear() ? dateFmt.format(date) : dateYearFmt.format(date).replace(" г.", "");
}

export function formatCount(n: number) {
  return compactFmt.format(n);
}

/** Склонение: plural(5, ["голос", "голоса", "голосов"]) → «голосов». */
export function plural(n: number, forms: [string, string, string]) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
  return forms[2];
}
