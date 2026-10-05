-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" BIGSERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" TEXT,
    "visitorId" TEXT,
    "path" TEXT,
    "entityType" TEXT,
    "entityId" TEXT,
    "ipHash" TEXT,
    "device" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "country" TEXT,
    "referrer" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "meta" JSONB,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyStat" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "type" TEXT NOT NULL,
    "entityType" TEXT NOT NULL DEFAULT '',
    "entityId" TEXT NOT NULL DEFAULT '',
    "source" TEXT NOT NULL DEFAULT '',
    "device" TEXT NOT NULL DEFAULT '',
    "count" INTEGER NOT NULL,
    "uniques" INTEGER NOT NULL,

    CONSTRAINT "DailyStat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnalyticsEvent_type_ts_idx" ON "AnalyticsEvent"("type", "ts");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_entityType_entityId_ts_idx" ON "AnalyticsEvent"("entityType", "entityId", "ts");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_ts_idx" ON "AnalyticsEvent"("ts");

-- CreateIndex
CREATE INDEX "DailyStat_type_date_idx" ON "DailyStat"("type", "date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyStat_date_type_entityType_entityId_source_device_key" ON "DailyStat"("date", "type", "entityType", "entityId", "source", "device");
