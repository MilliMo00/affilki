import type { VoterSession } from "@prisma/client";
import { db } from "@/lib/db";
import { votesOf } from "./vote";

/** То, что сайт знает о вошедшем: имя для шапки и его голоса. Telegram ID наружу не отдаём. */
export async function describeVoter(session: VoterSession) {
  return {
    user: { name: session.tgFirstName ?? session.tgUsername ?? "Гость", username: session.tgUsername },
    votes: await votesOf(session.tgUserId),
    // Сколько заявок вернулось с правками — точка-уведомление в шапке.
    inbox: await db.submission.count({ where: { tgUserId: session.tgUserId, status: "CHANGES_REQUESTED" } }),
  };
}

export type Me = Awaited<ReturnType<typeof describeVoter>>;
