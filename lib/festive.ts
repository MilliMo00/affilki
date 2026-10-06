/**
 * Новогоднее оформление: снег, гирлянда, подарки. Включается само с октября по середину января —
 * премия подводит итоги под Новый год — и само выключается после праздников.
 */
export function isFestive(now = new Date()) {
  const month = now.getMonth();
  return month >= 9 || (month === 0 && now.getDate() <= 15);
}
