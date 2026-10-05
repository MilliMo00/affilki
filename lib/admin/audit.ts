import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { AdminContext } from "./auth";

type Snapshot = Record<string, unknown> | null | undefined;

// BigInt и даты не сериализуются в JSON сами — приводим к строкам.
const plain = (value: Snapshot): Prisma.InputJsonValue | undefined =>
  value ? JSON.parse(JSON.stringify(value, (_, v) => (typeof v === "bigint" ? v.toString() : v))) : undefined;

/** Запись в журнал действий: кто, что, над чем, значения до и после. Журнал только пополняется. */
export async function audit(
  context: AdminContext,
  action: string,
  entity: { type: string; id?: string | null },
  before?: Snapshot,
  after?: Snapshot,
) {
  await db.auditLog.create({
    data: {
      adminId: context.admin.id,
      adminName: context.admin.name,
      action,
      entityType: entity.type,
      entityId: entity.id ?? null,
      before: plain(before),
      after: plain(after),
      ipHash: context.ipHash,
    },
  });
}
