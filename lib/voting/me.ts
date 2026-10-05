import type { VoterSession } from "@prisma/client";
import { votesOf } from "./vote";

/** То, что сайт знает о вошедшем: имя для шапки и его голоса. Telegram ID наружу не отдаём. */
export async function describeVoter(session: VoterSession) {
  return {
    user: { name: session.tgFirstName ?? session.tgUsername ?? "Гость", username: session.tgUsername },
    votes: await votesOf(session.tgUserId),
  };
}

export type Me = Awaited<ReturnType<typeof describeVoter>>;
