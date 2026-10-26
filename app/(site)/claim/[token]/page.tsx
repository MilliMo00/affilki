import type { Metadata } from "next";
import Link from "next/link";
import { ClaimGate } from "@/components/submissions/ClaimGate";
import { Watermark } from "@/components/brand/Watermark";
import { getCategories, getOpenNominations } from "@/lib/data";
import { db } from "@/lib/db";
import { readDetails, readLinks } from "@/lib/profile";

export const metadata: Metadata = {
  title: "Заявка на участие",
  description: "Редакция AFFILKI подготовила заявку на участие в премии — проверьте и подтвердите.",
  // Личная ссылка: в поиске ей делать нечего.
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ClaimPage({ params }: PageProps<"/claim/[token]">) {
  const token = (await params).token;
  const invite = await db.submission.findUnique({ where: { inviteToken: token } });

  if (!invite || invite.status !== "INVITED") {
    return (
      <div className="container-page py-16">
        <div className="mx-auto max-w-xl rounded-petal border border-petal bg-deep/40 p-8 text-center">
          <h1 className="text-2xl">Ссылка уже не действует</h1>
          <p className="mt-3 text-lg text-text">Заявку уже подтвердили, или редакция её отозвала. Статус своих заявок можно посмотреть в «Моих заявках».</p>
          <Link href="/my" className="mt-6 inline-flex h-11 items-center rounded-full bg-paper px-5 font-semibold text-deep hover:bg-text">
            Мои заявки
          </Link>
        </div>
      </div>
    );
  }

  const [nominations, categories] = await Promise.all([getOpenNominations(), getCategories()]);
  const nominationTitle = nominations.find((nomination) => nomination.id === invite.nominationId)?.title;

  return (
    <div>
      <section className="grain relative overflow-hidden bg-hero">
        <Watermark />
        <div className="container-page relative py-12 sm:py-16">
          <p className="inline-flex rounded-full border border-paper/50 bg-deep/50 px-3 py-1 text-sm font-semibold text-paper">Приглашение в AFFILKI Awards 2026</p>
          <h1 className="mt-4 max-w-3xl text-3xl sm:text-4xl">Мы подготовили заявку для «{invite.title}»</h1>
          <p className="mt-4 max-w-2xl text-lg text-paper">
            Редакция AFFILKI заполнила анкету{nominationTitle ? ` в номинацию «${nominationTitle}»` : ""} по открытым данным о вашей команде.
            Проверьте её, поправьте, если нужно, и подтвердите — без правок страница команды сразу появится на сайте.
          </p>
        </div>
      </section>
      <div className="container-page py-10 sm:py-12">
        <div className="mx-auto max-w-2xl">
          <ClaimGate
            token={token}
            nominations={nominations}
            categories={categories}
            draft={{
              id: invite.id,
              kind: "NOMINEE",
              authorName: invite.authorName,
              contact: invite.contact === "—" ? "" : invite.contact,
              title: invite.title,
              text: invite.text,
              imageUrl: invite.imageUrl,
              links: readLinks(invite.links),
              details: readDetails(invite.details),
              nominationId: invite.nominationId,
              categorySlug: null,
            }}
          />
        </div>
      </div>
    </div>
  );
}
