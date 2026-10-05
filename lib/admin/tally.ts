import { db } from "@/lib/db";

/** Точные счётчики по участникам сезона — только для админки. */
export async function tallySeason(seasonId: string) {
  const banned = (await db.tgBan.findMany({ select: { tgUserId: true } })).map((b) => b.tgUserId);
  const [counted, voided, nominations] = await Promise.all([
    db.vote.groupBy({ by: ["nomineeId"], where: { voidedAt: null, tgUserId: { notIn: banned }, nomination: { seasonId } }, _count: { _all: true } }),
    db.vote.groupBy({ by: ["nomineeId"], where: { OR: [{ voidedAt: { not: null } }, { tgUserId: { in: banned } }], nomination: { seasonId } }, _count: { _all: true } }),
    db.nomination.findMany({ where: { seasonId }, orderBy: { order: "asc" }, include: { nominees: true } }),
  ]);
  const countedBy = new Map(counted.map((g) => [g.nomineeId, g._count._all]));
  const voidedBy = new Map(voided.map((g) => [g.nomineeId, g._count._all]));

  return nominations.map((nomination) => {
    const rows = nomination.nominees
      .map((nominee) => ({ nominee, votes: countedBy.get(nominee.id) ?? 0, excluded: voidedBy.get(nominee.id) ?? 0 }))
      .sort((a, b) => b.votes - a.votes || a.nominee.name.localeCompare(b.nominee.name, "ru"));
    const total = rows.reduce((sum, row) => sum + row.votes, 0);
    return {
      nomination,
      total,
      rows: rows.map((row, i) => ({ ...row, place: i + 1, share: total > 0 ? row.votes / total : 0 })),
    };
  });
}
