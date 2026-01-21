-- CreateEnum
CREATE TYPE "AdType" AS ENUM ('VIDEO', 'IMAGE', 'TEXT', 'HTML');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'ENDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PricingModel" AS ENUM ('CPM', 'CPC', 'CPV', 'FIXED');

-- CreateEnum
CREATE TYPE "ServingStatus" AS ENUM ('ACTIVE', 'PAUSED');

-- CreateEnum
CREATE TYPE "AdEventType" AS ENUM ('IMPRESSION', 'START', 'FIRST_QUARTILE', 'MIDPOINT', 'THIRD_QUARTILE', 'COMPLETE', 'SKIP', 'CLICK');

-- CreateEnum
CREATE TYPE "WebhookStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'RETRYING');

-- CreateEnum
CREATE TYPE "LedgerDirection" AS ENUM ('CREDIT', 'DEBIT');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'ADVERTISER', 'PUBLISHER');

-- CreateEnum
CREATE TYPE "CreativeStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "BillingStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'REVOKED');

-- CreateTable
CREATE TABLE "Advertiser" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "authEmail" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "website" TEXT,
    "apiKey" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'ADVERTISER',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Advertiser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Publisher" (
    "id" TEXT NOT NULL,
    "siteName" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "authEmail" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'PUBLISHER',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "webhookUrl" TEXT,
    "webhookSecret" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Publisher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdUnit" (
    "id" TEXT NOT NULL,
    "publisherId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "adType" "AdType" NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "advertiserId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "budgetCents" INTEGER,
    "spendCents" INTEGER NOT NULL DEFAULT 0,
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "targetingConfig" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Creative" (
    "id" TEXT NOT NULL,
    "advertiserId" TEXT NOT NULL,
    "campaignId" TEXT,
    "name" TEXT NOT NULL,
    "type" "AdType" NOT NULL,
    "status" "CreativeStatus" NOT NULL DEFAULT 'DRAFT',
    "assetUrl" TEXT NOT NULL,
    "clickUrl" TEXT,
    "durationMs" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "version" INTEGER NOT NULL DEFAULT 1,
    "parentId" TEXT,
    "approvalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Creative_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServingConfig" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "adUnitId" TEXT NOT NULL,
    "pricingModel" "PricingModel" NOT NULL DEFAULT 'CPM',
    "priceCents" INTEGER NOT NULL,
    "status" "ServingStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServingConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdEvent" (
    "id" TEXT NOT NULL,
    "eventType" "AdEventType" NOT NULL,
    "publisherId" TEXT NOT NULL,
    "adUnitId" TEXT NOT NULL,
    "campaignId" TEXT,
    "creativeId" TEXT,
    "advertiserId" TEXT,
    "requestId" TEXT,
    "signature" TEXT,
    "ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipHash" TEXT,
    "uaHash" TEXT,

    CONSTRAINT "AdEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookDelivery" (
    "id" TEXT NOT NULL,
    "publisherId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "targetUrl" TEXT NOT NULL,
    "status" "WebhookStatus" NOT NULL DEFAULT 'PENDING',
    "attempt" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3),
    "responseStatus" INTEGER,
    "error" TEXT,
    "payload" JSONB NOT NULL,
    "signature" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebhookDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerEntry" (
    "id" TEXT NOT NULL,
    "eventId" TEXT,
    "advertiserId" TEXT,
    "publisherId" TEXT,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "direction" "LedgerDirection" NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdEventRollupDaily" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "publisherId" TEXT NOT NULL,
    "adUnitId" TEXT,
    "campaignId" TEXT,
    "creativeId" TEXT,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "completes" INTEGER NOT NULL DEFAULT 0,
    "skips" INTEGER NOT NULL DEFAULT 0,
    "spendCents" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AdEventRollupDaily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSession" (
    "id" TEXT NOT NULL,
    "advertiserId" TEXT,
    "publisherId" TEXT,
    "token" TEXT NOT NULL,
    "refreshToken" TEXT,
    "status" "SessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiRateLimit" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "requests" INTEGER NOT NULL DEFAULT 0,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiRateLimit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignVersion" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "budgetCents" INTEGER,
    "targetingConfig" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CampaignVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Billing" (
    "id" TEXT NOT NULL,
    "advertiserId" TEXT,
    "publisherId" TEXT,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "BillingStatus" NOT NULL DEFAULT 'PENDING',
    "description" TEXT,
    "invoiceUrl" TEXT,
    "paymentMethod" TEXT,
    "transactionId" TEXT,
    "dueDate" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Billing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatGPTToken" (
    "id" TEXT NOT NULL,
    "advertiserId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "maxUsage" INTEGER,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatGPTToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "publisherId" TEXT,
    "advertiserId" TEXT,
    "campaignId" TEXT,
    "creativeId" TEXT,
    "adUnitId" TEXT,
    "value" DOUBLE PRECISION,
    "metadata" JSONB,
    "ipHash" TEXT,
    "userAgent" TEXT,
    "referrer" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookRetry" (
    "id" TEXT NOT NULL,
    "deliveryId" TEXT NOT NULL,
    "attempt" INTEGER NOT NULL,
    "status" "WebhookStatus" NOT NULL,
    "responseStatus" INTEGER,
    "responseBody" TEXT,
    "error" TEXT,
    "retryAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookRetry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Advertiser_authEmail_key" ON "Advertiser"("authEmail");

-- CreateIndex
CREATE UNIQUE INDEX "Advertiser_apiKey_key" ON "Advertiser"("apiKey");

-- CreateIndex
CREATE UNIQUE INDEX "Publisher_authEmail_key" ON "Publisher"("authEmail");

-- CreateIndex
CREATE UNIQUE INDEX "Publisher_appId_key" ON "Publisher"("appId");

-- CreateIndex
CREATE UNIQUE INDEX "Publisher_apiKey_key" ON "Publisher"("apiKey");

-- CreateIndex
CREATE UNIQUE INDEX "AdUnit_publisherId_key_key" ON "AdUnit"("publisherId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "ServingConfig_campaignId_adUnitId_key" ON "ServingConfig"("campaignId", "adUnitId");

-- CreateIndex
CREATE UNIQUE INDEX "LedgerEntry_eventId_key" ON "LedgerEntry"("eventId");

-- CreateIndex
CREATE INDEX "AdEventRollupDaily_publisherId_idx" ON "AdEventRollupDaily"("publisherId");

-- CreateIndex
CREATE INDEX "AdEventRollupDaily_campaignId_idx" ON "AdEventRollupDaily"("campaignId");

-- CreateIndex
CREATE INDEX "AdEventRollupDaily_creativeId_idx" ON "AdEventRollupDaily"("creativeId");

-- CreateIndex
CREATE INDEX "AdEventRollupDaily_adUnitId_idx" ON "AdEventRollupDaily"("adUnitId");

-- CreateIndex
CREATE UNIQUE INDEX "UserSession_token_key" ON "UserSession"("token");

-- CreateIndex
CREATE UNIQUE INDEX "UserSession_refreshToken_key" ON "UserSession"("refreshToken");

-- CreateIndex
CREATE INDEX "UserSession_token_idx" ON "UserSession"("token");

-- CreateIndex
CREATE INDEX "UserSession_expiresAt_idx" ON "UserSession"("expiresAt");

-- CreateIndex
CREATE INDEX "ApiRateLimit_windowStart_idx" ON "ApiRateLimit"("windowStart");

-- CreateIndex
CREATE UNIQUE INDEX "ApiRateLimit_identifier_endpoint_windowStart_key" ON "ApiRateLimit"("identifier", "endpoint", "windowStart");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignVersion_campaignId_version_key" ON "CampaignVersion"("campaignId", "version");

-- CreateIndex
CREATE INDEX "Billing_status_idx" ON "Billing"("status");

-- CreateIndex
CREATE INDEX "Billing_dueDate_idx" ON "Billing"("dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "ChatGPTToken_token_key" ON "ChatGPTToken"("token");

-- CreateIndex
CREATE INDEX "ChatGPTToken_token_idx" ON "ChatGPTToken"("token");

-- CreateIndex
CREATE INDEX "ChatGPTToken_expiresAt_idx" ON "ChatGPTToken"("expiresAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_eventType_idx" ON "AnalyticsEvent"("eventType");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_timestamp_idx" ON "AnalyticsEvent"("timestamp");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_publisherId_idx" ON "AnalyticsEvent"("publisherId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_advertiserId_idx" ON "AnalyticsEvent"("advertiserId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_campaignId_idx" ON "AnalyticsEvent"("campaignId");

-- CreateIndex
CREATE INDEX "WebhookRetry_retryAt_idx" ON "WebhookRetry"("retryAt");

-- AddForeignKey
ALTER TABLE "AdUnit" ADD CONSTRAINT "AdUnit_publisherId_fkey" FOREIGN KEY ("publisherId") REFERENCES "Publisher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_advertiserId_fkey" FOREIGN KEY ("advertiserId") REFERENCES "Advertiser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Creative" ADD CONSTRAINT "Creative_advertiserId_fkey" FOREIGN KEY ("advertiserId") REFERENCES "Advertiser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Creative" ADD CONSTRAINT "Creative_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Creative" ADD CONSTRAINT "Creative_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Creative"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServingConfig" ADD CONSTRAINT "ServingConfig_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServingConfig" ADD CONSTRAINT "ServingConfig_adUnitId_fkey" FOREIGN KEY ("adUnitId") REFERENCES "AdUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdEvent" ADD CONSTRAINT "AdEvent_publisherId_fkey" FOREIGN KEY ("publisherId") REFERENCES "Publisher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdEvent" ADD CONSTRAINT "AdEvent_adUnitId_fkey" FOREIGN KEY ("adUnitId") REFERENCES "AdUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdEvent" ADD CONSTRAINT "AdEvent_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdEvent" ADD CONSTRAINT "AdEvent_creativeId_fkey" FOREIGN KEY ("creativeId") REFERENCES "Creative"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdEvent" ADD CONSTRAINT "AdEvent_advertiserId_fkey" FOREIGN KEY ("advertiserId") REFERENCES "Advertiser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookDelivery" ADD CONSTRAINT "WebhookDelivery_publisherId_fkey" FOREIGN KEY ("publisherId") REFERENCES "Publisher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookDelivery" ADD CONSTRAINT "WebhookDelivery_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "AdEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "AdEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_advertiserId_fkey" FOREIGN KEY ("advertiserId") REFERENCES "Advertiser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_publisherId_fkey" FOREIGN KEY ("publisherId") REFERENCES "Publisher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdEventRollupDaily" ADD CONSTRAINT "AdEventRollupDaily_publisherId_fkey" FOREIGN KEY ("publisherId") REFERENCES "Publisher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdEventRollupDaily" ADD CONSTRAINT "AdEventRollupDaily_adUnitId_fkey" FOREIGN KEY ("adUnitId") REFERENCES "AdUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdEventRollupDaily" ADD CONSTRAINT "AdEventRollupDaily_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdEventRollupDaily" ADD CONSTRAINT "AdEventRollupDaily_creativeId_fkey" FOREIGN KEY ("creativeId") REFERENCES "Creative"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_advertiserId_fkey" FOREIGN KEY ("advertiserId") REFERENCES "Advertiser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_publisherId_fkey" FOREIGN KEY ("publisherId") REFERENCES "Publisher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignVersion" ADD CONSTRAINT "CampaignVersion_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Billing" ADD CONSTRAINT "Billing_advertiserId_fkey" FOREIGN KEY ("advertiserId") REFERENCES "Advertiser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Billing" ADD CONSTRAINT "Billing_publisherId_fkey" FOREIGN KEY ("publisherId") REFERENCES "Publisher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatGPTToken" ADD CONSTRAINT "ChatGPTToken_advertiserId_fkey" FOREIGN KEY ("advertiserId") REFERENCES "Advertiser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookRetry" ADD CONSTRAINT "WebhookRetry_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "WebhookDelivery"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
