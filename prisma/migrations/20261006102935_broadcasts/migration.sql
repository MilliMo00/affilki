-- CreateEnum
CREATE TYPE "BroadcastStatus" AS ENUM ('SENDING', 'DONE', 'CANCELLED');

-- CreateTable
CREATE TABLE "BotUser" (
    "tgUserId" BIGINT NOT NULL,
    "username" TEXT,
    "firstName" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "blockedAt" TIMESTAMP(3),
    "unsubscribedAt" TIMESTAMP(3),

    CONSTRAINT "BotUser_pkey" PRIMARY KEY ("tgUserId")
);

-- CreateTable
CREATE TABLE "Broadcast" (
    "id" TEXT NOT NULL,
    "segment" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "imageUrl" TEXT,
    "photoFileId" TEXT,
    "buttonText" TEXT,
    "buttonUrl" TEXT,
    "status" "BroadcastStatus" NOT NULL DEFAULT 'SENDING',
    "total" INTEGER NOT NULL DEFAULT 0,
    "sent" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "blocked" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "Broadcast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BroadcastRecipient" (
    "id" TEXT NOT NULL,
    "broadcastId" TEXT NOT NULL,
    "tgUserId" BIGINT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "error" TEXT,

    CONSTRAINT "BroadcastRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BroadcastRecipient_broadcastId_status_idx" ON "BroadcastRecipient"("broadcastId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "BroadcastRecipient_broadcastId_tgUserId_key" ON "BroadcastRecipient"("broadcastId", "tgUserId");

-- AddForeignKey
ALTER TABLE "BroadcastRecipient" ADD CONSTRAINT "BroadcastRecipient_broadcastId_fkey" FOREIGN KEY ("broadcastId") REFERENCES "Broadcast"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Все, кто уже общался с ботом (входил, голосовал, подавал заявку), становятся его подписчиками.
INSERT INTO "BotUser" ("tgUserId", "username", "firstName")
SELECT DISTINCT ON (id) id, username, first_name FROM (
  SELECT "tgUserId" AS id, "tgUsername" AS username, "tgFirstName" AS first_name FROM "VoterSession"
  UNION ALL
  SELECT "tgUserId", "tgUsername", NULL FROM "Submission"
  UNION ALL
  SELECT "tgUserId", "tgUsername", NULL FROM "Vote" WHERE "tgUserId" > 0
  UNION ALL
  SELECT "tgId", NULL, "name" FROM "AdminUser"
) known
ORDER BY id, first_name NULLS LAST
ON CONFLICT ("tgUserId") DO NOTHING;
