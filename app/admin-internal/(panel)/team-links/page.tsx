import Link from "next/link";
import { ActionForm } from "@/components/admin/ActionForm";
import { CopyButton } from "@/components/admin/CopyButton";
import { adminInput } from "@/components/admin/styles";
import { Badge, Card, PageTitle } from "@/components/admin/ui";
import { requirePermission } from "@/lib/admin/auth";
import { adminUrl } from "@/lib/admin/path";
import { db } from "@/lib/db";
import { ContactActions } from "@/components/admin/ContactActions";
import { readProfile } from "@/lib/profile";
import { shareToTelegram, teamContacts, teamLink, teamMessage } from "@/lib/team";
import { makeAllTeamLinks, makeTeamLink } from "./actions";

/** Ссылки команд на бота: создать, скопировать с готовым сообщением, заменить. */
export default async function TeamLinksPage() {
  await requirePermission("awards");
  const season = await db.season.findFirst({ orderBy: { year: "desc" } });
  const nominations = await db.nomination.findMany({
    where: { seasonId: season?.id },
    orderBy: { order: "asc" },
    include: { nominees: { where: { published: true }, orderBy: { name: "asc" }, include: { owners: { orderBy: { createdAt: "asc" } } } } },
  });
  const all = nominations.flatMap((nomination) => nomination.nominees);
  // Контакт команды — из заявки, по которой участник появился на сайте.
  const submissions = await db.submission.findMany({ where: { resultId: { in: all.map((nominee) => nominee.id) } }, select: { resultId: true, contact: true } });
  const contactOf = new Map(submissions.map((submission) => [submission.resultId, submission.contact]));
  const withoutLink = all.filter((nominee) => !nominee.teamToken).length;
  const connected = all.filter((nominee) => nominee.owners.length > 0).length;

  return (
    <>
      <PageTitle
        title="Ссылки для команд"
        lead="Личная ссылка команды на бота: по ней бот привязывает Telegram человека к странице команды и показывает голоса и место в номинации. Скопируй готовое сообщение и отправь менеджеру команды."
      />

      <Card className="mb-6">
        <p className="text-text">
          Участников на сайте: <b className="text-paper">{all.length}</b> · команд подключилось к боту: <b className="text-paper">{connected}</b>
          {withoutLink > 0 && (
            <>
              {" "}
              · без ссылки: <b className="text-paper">{withoutLink}</b>
            </>
          )}
        </p>
        {withoutLink > 0 && (
          <ActionForm action={makeAllTeamLinks} submit={`Создать ссылки для всех (${withoutLink})`} className="mt-4">
            <span />
          </ActionForm>
        )}
      </Card>

      {nominations
        .filter((nomination) => nomination.nominees.length > 0)
        .map((nomination) => (
          <Card key={nomination.id} title={nomination.title} className="mb-6">
            <ul className="space-y-6">
              {nomination.nominees.map((nominee) => {
                const contacts = teamContacts(contactOf.get(nominee.id), readProfile(nominee.profile).buttons);
                const message = nominee.teamToken && season ? teamMessage({ name: nominee.name, slug: nominee.slug, nominationTitle: nomination.title }, nominee.teamToken, season.votingStartsAt) : null;
                return (
                  <li key={nominee.id} className="border-b border-petal/20 pb-6 last:border-0 last:pb-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <Link href={adminUrl(`/nominees/${nominee.id}`)} className="font-semibold text-paper hover:underline">
                        {nominee.name}
                      </Link>
                      {nominee.owners.length > 0 ? (
                        <Badge tone="good">подключились: {nominee.owners.map((owner) => (owner.username ? `@${owner.username}` : "без username")).join(", ")}</Badge>
                      ) : (
                        <Badge>ещё не подключились</Badge>
                      )}
                    </div>

                    {message && (
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <ContactActions contacts={contacts} message={message} shareUrl={shareToTelegram(message, nominee.teamToken!)} />
                        {contacts.length === 0 && <span className="text-sm text-muted">Контакт в анкете не найден — отправь через Telegram и выбери чат.</span>}
                      </div>
                    )}

                    {message ? (
                      <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
                        <textarea readOnly value={message} rows={7} aria-label={`Сообщение для команды ${nominee.name}`} className={`${adminInput} text-sm`} />
                        <div className="flex flex-wrap content-start gap-2 lg:w-56 lg:flex-col">
                          <CopyButton text={message} label="Скопировать сообщение" />
                          <CopyButton text={teamLink(nominee.teamToken!)} label="Скопировать ссылку" />
                          <ActionForm action={makeTeamLink.bind(null, nominee.id, true)} submit="Заменить ссылку" danger>
                            <span />
                          </ActionForm>
                        </div>
                      </div>
                    ) : (
                      <ActionForm action={makeTeamLink.bind(null, nominee.id, false)} submit="Создать ссылку" className="mt-3">
                        <span />
                      </ActionForm>
                    )}
                  </li>
                );
              })}
            </ul>
          </Card>
        ))}
      {all.length === 0 && <Card><p className="text-muted">На сайте пока нет участников.</p></Card>}
    </>
  );
}
