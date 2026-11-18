-- Ссылки команд на бота и привязанные к участнику Telegram-аккаунты команды.
ALTER TABLE "Nominee" ADD COLUMN "teamToken" TEXT;
CREATE UNIQUE INDEX "Nominee_teamToken_key" ON "Nominee"("teamToken");

CREATE TABLE "NomineeOwner" (
    "nomineeId" TEXT NOT NULL,
    "tgUserId" BIGINT NOT NULL,
    "username" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NomineeOwner_pkey" PRIMARY KEY ("nomineeId","tgUserId")
);
CREATE INDEX "NomineeOwner_tgUserId_idx" ON "NomineeOwner"("tgUserId");
ALTER TABLE "NomineeOwner" ADD CONSTRAINT "NomineeOwner_nomineeId_fkey" FOREIGN KEY ("nomineeId") REFERENCES "Nominee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
