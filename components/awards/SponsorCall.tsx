import { Send } from "lucide-react";
import { Flower } from "@/components/brand/Flower";
import { Snowfall } from "@/components/festive/Snowfall";
import { Button } from "@/components/ui/Button";
import { PARTNERS_CONTACT_URL, handleOf } from "@/lib/env";

/** Приглашение спонсорам номинаций с контактом для связи. */
export function SponsorCall() {
  const handle = handleOf(PARTNERS_CONTACT_URL);

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
                    Кликабельный логотип на каждой странице сайта и блок о компании в разделе «Спонсоры». Логотип — в постах
                    Telegram-канала. Мест четыре.
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-paper">Спонсор номинации</dt>
                  <dd className="mt-1 text-muted-bright">
                    Лицо одной номинации: логотип на её странице и обложке, отметка «Спонсор номинации» и кнопка «Подробнее о
                    спонсоре» с описанием и ссылками. Подходит компаниям из той же ниши: например, дизайн-студия может поддержать
                    номинацию дизайн-агентств.
                  </dd>
                </div>
              </dl>
            </div>

            <div className="flex flex-col items-start gap-3 lg:items-end">
              <Button href={PARTNERS_CONTACT_URL} size="lg">
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
