-- CreateEnum
CREATE TYPE "IntentStatus" AS ENUM ('PENDING', 'BOUND', 'CONFIRMED', 'USED', 'REJECTED');

-- CreateTable
CREATE TABLE "LoginIntent" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "browserHash" TEXT NOT NULL,
    "status" "IntentStatus" NOT NULL DEFAULT 'PENDING',
    "tgUserId" BIGINT,
    "tgUsername" TEXT,
    "tgFirstName" TEXT,
    "hasAvatar" BOOLEAN NOT NULL DEFAULT false,
    "ipHash" TEXT NOT NULL,
    "uaHash" TEXT NOT NULL,
    "uaLabel" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoginIntent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoterSession" (
    "id" TEXT NOT NULL,
    "tgUserId" BIGINT NOT NULL,
    "tgUsername" TEXT,
    "tgFirstName" TEXT,
    "hasAvatar" BOOLEAN NOT NULL DEFAULT false,
    "ipHash" TEXT NOT NULL,
    "uaHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "VoterSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vote" (
    "id" TEXT NOT NULL,
    "tgUserId" BIGINT NOT NULL,
    "tgUsername" TEXT,
    "hasAvatar" BOOLEAN NOT NULL,
    "nominationId" TEXT NOT NULL,
    "nomineeId" TEXT NOT NULL,
    "ipHash" TEXT NOT NULL,
    "uaHash" TEXT NOT NULL,
    "captchaKind" TEXT NOT NULL DEFAULT 'turnstile',
    "voidedAt" TIMESTAMP(3),
    "voidReason" TEXT,
    "voidedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TgBan" (
    "tgUserId" BIGINT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TgBan_pkey" PRIMARY KEY ("tgUserId")
);

-- CreateIndex
CREATE UNIQUE INDEX "LoginIntent_token_key" ON "LoginIntent"("token");

-- CreateIndex
CREATE INDEX "LoginIntent_ipHash_createdAt_idx" ON "LoginIntent"("ipHash", "createdAt");

-- CreateIndex
CREATE INDEX "VoterSession_tgUserId_idx" ON "VoterSession"("tgUserId");

-- CreateIndex
CREATE INDEX "Vote_nomineeId_createdAt_idx" ON "Vote"("nomineeId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Vote_tgUserId_nominationId_key" ON "Vote"("tgUserId", "nominationId");

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_nominationId_fkey" FOREIGN KEY ("nominationId") REFERENCES "Nomination"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_nomineeId_fkey" FOREIGN KEY ("nomineeId") REFERENCES "Nominee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
