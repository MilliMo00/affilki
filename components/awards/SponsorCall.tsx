import { Send } from "lucide-react";
import { Flower } from "@/components/brand/Flower";
import { Snowfall } from "@/components/festive/Snowfall";
import { Button } from "@/components/ui/Button";
import { ADS_CONTACT_URL } from "@/lib/env";

/** Приглашение спонсорам номинаций с контактом для связи. */
export function SponsorCall() {
  const handle = `@${ADS_CONTACT_URL.split("/").pop()}`;

  return (
    <section aria-labelledby="sponsor-title" className="border-y border-petal/40 bg-deep">
      <div className="container-page py-12 sm:py-14">
        <div className="relative overflow-hidden rounded-petal border border-petal bg-surface p-6 sm:p-10">
          <div aria-hidden className="pointer-events-none absolute -right-16 -top-24 aspect-square w-72 text-paper/10 sm:w-96">
            <Flower size="100%" rays={false} rayColor="var(--surface)" />
          </div>

          <Snowfall density={0.4} />

          <div className="relative grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-center">
            <div>
              <p className="font-semibold text-muted-bright">Спонсорам и партнёрам</p>
              <h2 id="sponsor-title" className="mt-2 text-2xl sm:text-3xl">
                Стань спонсором премии или номинации
              </h2>
              <p className="mt-4 max-w-xl text-lg text-paper">
                За премией следит рынок: команды, партнёрки и сервисы приводят сюда свою аудиторию голосовать.
              </p>
              <dl className="mt-5 max-w-xl space-y-4">
                <div>
                  <dt className="font-semibold text-paper">Спонсор премии</dt>
                  <dd className="mt-1 text-muted-bright">
                    Логотип на главной, в разделе премии, на live-табло и на страницах всех номинаций и участников. Мест четыре.
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-paper">Спонсор номинации</dt>
                  <dd className="mt-1 text-muted-bright">
                    Отдельный блок на странице одной номинации — у каждой номинации один спонсор. Подходит компаниям из той же
                    ниши: например, дизайн-студия может поддержать номинацию дизайн-агентств.
                  </dd>
                </div>
              </dl>
            </div>

            <div className="flex flex-col items-start gap-3 lg:items-end">
              <Button href={ADS_CONTACT_URL} size="lg">
                <Send size={20} strokeWidth={1.75} aria-hidden />
                Написать {handle}
              </Button>
              <p className="text-sm text-muted-bright lg:text-right">Напиши — расскажем про свободные места и условия. Там же — про рекламу на сайте.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
