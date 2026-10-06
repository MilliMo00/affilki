// Общий стиль полей админки. Лежит в обычном модуле, а не в клиентском компоненте:
// серверная страница, импортирующая константу из файла с "use client", получает вместо строки
// ссылку на клиентский модуль, и склейка классов (`${adminInput} max-w-xs`) ломается.
export const adminInput =
  "w-full rounded-card border border-petal/60 bg-deep/40 px-3 py-2 text-base text-paper placeholder:text-muted/70 focus:border-glow";
