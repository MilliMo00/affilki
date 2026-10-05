-- CreateEnum
CREATE TYPE "ArticleStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('NEW', 'IN_REVIEW', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "Stage" AS ENUM ('APPLICATIONS', 'SHORTLIST', 'VOTING', 'COUNTING', 'CEREMONY');

-- CreateEnum
CREATE TYPE "LiveMode" AS ENUM ('PERCENT', 'COUNTS');

-- CreateEnum
CREATE TYPE "NomGroup" AS ENUM ('TEAMS', 'MEDIA', 'MARKET');

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "contentHtml" TEXT NOT NULL,
    "coverUrl" TEXT,
    "categoryId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL DEFAULT 'AFFILKI',
    "readingMin" INTEGER NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "status" "ArticleStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "seoTitle" TEXT,
    "seoDesc" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArticleRequest" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tgContact" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "draftUrl" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'NEW',
    "ipHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArticleRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Season" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "stage" "Stage" NOT NULL DEFAULT 'APPLICATIONS',
    "votingStartsAt" TIMESTAMP(3) NOT NULL,
    "votingEndsAt" TIMESTAMP(3) NOT NULL,
    "nextStageAt" TIMESTAMP(3),
    "resultsPublished" BOOLEAN NOT NULL DEFAULT false,
    "communityWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "juryWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "requireChannel" BOOLEAN NOT NULL DEFAULT true,
    "requireUsername" BOOLEAN NOT NULL DEFAULT false,
    "requireAvatar" BOOLEAN NOT NULL DEFAULT false,
    "maxTelegramId" BIGINT,
    "liveEnabled" BOOLEAN NOT NULL DEFAULT true,
    "liveMode" "LiveMode" NOT NULL DEFAULT 'PERCENT',
    "liveRefreshSec" INTEGER NOT NULL DEFAULT 15,
    "liveMinVotes" INTEGER NOT NULL DEFAULT 30,
    "liveFreezeHours" INTEGER NOT NULL DEFAULT 48,
    "liveShowJury" BOOLEAN NOT NULL DEFAULT false,
    "maxVotesPerTenMinFactor" DOUBLE PRECISION NOT NULL DEFAULT 3,

    CONSTRAINT "Season_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Nomination" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "title" TEXT NOT NULL,
    "shortDesc" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "criteria" JSONB NOT NULL,
    "eligibility" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "group" "NomGroup" NOT NULL,
    "jury" TEXT,
    "requiresLegalReview" BOOLEAN NOT NULL DEFAULT false,
    "acceptingEntries" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Nomination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Nominee" (
    "id" TEXT NOT NULL,
    "nominationId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT,
    "tagline" TEXT,
    "description" TEXT,
    "links" JSONB,
    "juryScore" DOUBLE PRECISION,
    "sources" JSONB,
    "rightOfReply" TEXT,
    "legalChecked" BOOLEAN NOT NULL DEFAULT false,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Nominee_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Article_slug_key" ON "Article"("slug");

-- CreateIndex
CREATE INDEX "Article_status_publishedAt_idx" ON "Article"("status", "publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Season_year_key" ON "Season"("year");

-- CreateIndex
CREATE UNIQUE INDEX "Nomination_seasonId_slug_key" ON "Nomination"("seasonId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Nominee_slug_key" ON "Nominee"("slug");

-- CreateIndex
CREATE INDEX "Nominee_nominationId_idx" ON "Nominee"("nominationId");

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Nomination" ADD CONSTRAINT "Nomination_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Nominee" ADD CONSTRAINT "Nominee_nominationId_fkey" FOREIGN KEY ("nominationId") REFERENCES "Nomination"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
