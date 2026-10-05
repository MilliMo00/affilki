-- CreateEnum
CREATE TYPE "SubmissionKind" AS ENUM ('NOMINEE', 'ARTICLE');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('PENDING', 'CHANGES_REQUESTED', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Article" ADD COLUMN     "contentSource" TEXT;

-- DropTable
DROP TABLE "ArticleRequest";

-- DropEnum
DROP TYPE "RequestStatus";

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "kind" "SubmissionKind" NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "tgUserId" BIGINT NOT NULL,
    "tgUsername" TEXT,
    "authorName" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "imageUrl" TEXT,
    "links" JSONB NOT NULL,
    "nominationId" TEXT,
    "categorySlug" TEXT,
    "adminComment" TEXT,
    "resultId" TEXT,
    "ipHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdCampaign" (
    "id" TEXT NOT NULL,
    "slotKey" TEXT NOT NULL,
    "advertiser" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "mobileImageUrl" TEXT,
    "targetUrl" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "reportToken" TEXT,
    "reportExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Submission_status_createdAt_idx" ON "Submission"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Submission_tgUserId_idx" ON "Submission"("tgUserId");

-- CreateIndex
CREATE UNIQUE INDEX "AdCampaign_reportToken_key" ON "AdCampaign"("reportToken");

-- CreateIndex
CREATE INDEX "AdCampaign_slotKey_startsAt_endsAt_idx" ON "AdCampaign"("slotKey", "startsAt", "endsAt");

