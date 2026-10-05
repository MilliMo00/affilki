/** Момент N часов назад. Вынесено из компонентов: чтение часов в рендере считается побочным эффектом. */
export const hoursAgo = (hours: number) => new Date(Date.now() - hours * 3_600_000);
