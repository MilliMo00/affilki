import { ActionForm } from "@/components/admin/ActionForm";
import { adminInput } from "@/components/admin/styles";
import { Card, Check, Label, PageTitle } from "@/components/admin/ui";
import { requirePermission } from "@/lib/admin/auth";
import { db } from "@/lib/db";
import { STAGES, STAGE_LABELS } from "@/lib/stages";
import { saveSeason } from "./actions";

// Дата в формате поля datetime-local по московскому времени.
const msk = (date: Date | null) => (date ? new Date(date.getTime() + 3 * 3_600_000).toISOString().slice(0, 16) : "");

export default async function SeasonPage() {
  await requirePermission("season");
  const season = await db.season.findFirst({ orderBy: { year: "desc" } });
  if (!season) return <PageTitle title="Сезон" lead="Сезон ещё не создан." />;

  return (
    <>
      <PageTitle title="Сезон и защита" lead="Даты, этап, live-табло и пороги для голосующих. Время — московское." />
      <ActionForm action={saveSeason} submit="Сохранить" totp className="max-w-3xl space-y-6">
        <Card title="Сезон">
          <div className="grid gap-4 sm:grid-cols-2">
            <Label title="Название">
              <input name="title" defaultValue={season.title} required className={adminInput} />
            </Label>
            <Label title="Этап" hint="Меняет индикатор-цветок на сайте">
              <select name="stage" defaultValue={season.stage} className={adminInput}>
                {STAGES.map((stage) => (
                  <option key={stage} value={stage}>
                    {STAGE_LABELS[stage]}
                  </option>
                ))}
              </select>
            </Label>
            <Label title="Начало голосования">
              <input type="datetime-local" name="votingStartsAt" defaultValue={msk(season.votingStartsAt)} required className={adminInput} />
            </Label>
            <Label title="Конец голосования">
              <input type="datetime-local" name="votingEndsAt" defaultValue={msk(season.votingEndsAt)} required className={adminInput} />
            </Label>
            <Label title="Начало следующего этапа" hint="Необязательно, показывается в индикаторе">
              <input type="datetime-local" name="nextStageAt" defaultValue={msk(season.nextStageAt)} className={adminInput} />
            </Label>
          </div>
        </Card>

        <Card title="Кто может голосовать">
          <div className="space-y-4">
            <Check name="requireChannel" title="Только подписчики канала" defaultChecked={season.requireChannel} />
            <Check name="requireUsername" title="Только аккаунты с username" defaultChecked={season.requireUsername} />
            <Check name="requireAvatar" title="Только аккаунты с фото профиля" defaultChecked={season.requireAvatar} />
            <Label title="Максимальный Telegram ID" hint="Чем меньше ID, тем старше аккаунт. Аккаунты с ID больше порога не голосуют. Пусто — без ограничения.">
              <input name="maxTelegramId" inputMode="numeric" defaultValue={season.maxTelegramId?.toString() ?? ""} className={`${adminInput} max-w-xs`} />
            </Label>
          </div>
        </Card>

        <Card title="Live-табло">
          <div className="space-y-4">
            <Check name="liveEnabled" title="Показывать live-результаты" defaultChecked={season.liveEnabled} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Label title="Что показывать">
                <select name="liveMode" defaultValue={season.liveMode} className={adminInput}>
                  <option value="PERCENT">Только проценты</option>
                  <option value="COUNTS">Проценты и точные числа</option>
                </select>
              </Label>
              <Label title="Обновление, сек">
                <input type="number" name="liveRefreshSec" defaultValue={season.liveRefreshSec} min={5} className={adminInput} />
              </Label>
              <Label title="Порог голосов в номинации" hint="Пока меньше — «Набираем голоса»">
                <input type="number" name="liveMinVotes" defaultValue={season.liveMinVotes} min={0} className={adminInput} />
              </Label>
              <Label title="Заморозка до конца, часов" hint="Табло скрывается перед финалом">
                <input type="number" name="liveFreezeHours" defaultValue={season.liveFreezeHours} min={0} className={adminInput} />
              </Label>
            </div>
          </div>
        </Card>
      </ActionForm>
    </>
  );
}
