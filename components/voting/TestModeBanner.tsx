import { getCurrentSeason } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { testModeActive } from "@/lib/voting/test-mode";

/** Плашка над сайтом, пока владелец проверяет голосование: чтобы никто не принял тест за настоящий старт. */
export async function TestModeBanner() {
  const season = await getCurrentSeason();
  if (!season || !testModeActive(season)) return null;
  return (
    <p role="status" className="bg-danger px-4 py-2 text-center text-sm font-semibold text-ink">
      Тестовый режим: голосование открыто для проверки, все голоса будут удалены. Настоящее голосование начнётся{" "}
      {formatDate(season.votingStartsAt)}.
    </p>
  );
}
