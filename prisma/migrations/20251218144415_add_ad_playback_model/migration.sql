-- CreateEnum
CREATE TYPE "ResourceStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ResourceFormat" AS ENUM ('TEXT', 'MARKDOWN', 'HTML', 'JSON');

-- CreateEnum
CREATE TYPE "AccessMethod" AS ENUM ('AD_COMPLETION', 'SUBSCRIPTION', 'DIRECT_PAYMENT');

-- CreateEnum
CREATE TYPE "PlaybackStatus" AS ENUM ('STARTED', 'COMPLETED', 'SKIPPED', 'ERROR');

-- CreateTable
CREATE TABLE "PremiumResource" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "tags" TEXT[],
    "status" "ResourceStatus" NOT NULL DEFAULT 'DRAFT',
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "adRequirement" JSONB NOT NULL,
    "previewContent" TEXT NOT NULL,
    "estimatedReadTime" INTEGER NOT NULL DEFAULT 5,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PremiumResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceContent" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "fullContent" TEXT NOT NULL,
    "format" "ResourceFormat" NOT NULL DEFAULT 'TEXT',
    "fileUrl" TEXT,
    "fileSize" INTEGER,
    "checksum" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResourceContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdSession" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "adId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "requiredViewDuration" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdCompletion" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "viewDuration" INTEGER NOT NULL,
    "interactionData" JSONB,
    "paymentProcessed" BOOLEAN NOT NULL DEFAULT false,
    "billingAmount" DOUBLE PRECISION,
    "transactionId" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceAccess" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "sessionId" TEXT,
    "userId" TEXT NOT NULL,
    "accessMethod" "AccessMethod" NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "accessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResourceAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatGPTUser" (
    "id" TEXT NOT NULL,
    "chatgptUserId" TEXT NOT NULL,
    "email" TEXT,
    "displayName" TEXT,
    "subscriptionTier" TEXT NOT NULL DEFAULT 'free',
    "totalSpent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "usageStats" JSONB,
    "preferences" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatGPTUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdPlayback" (
    "id" TEXT NOT NULL,
    "creativeId" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "publisherId" TEXT,
    "status" "PlaybackStatus" NOT NULL DEFAULT 'STARTED',
    "requestedType" "AdType" NOT NULL,
    "viewDuration" INTEGER,
    "completedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdPlayback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PremiumResource_category_idx" ON "PremiumResource"("category");

-- CreateIndex
CREATE INDEX "PremiumResource_status_idx" ON "PremiumResource"("status");

-- CreateIndex
CREATE INDEX "PremiumResource_tags_idx" ON "PremiumResource"("tags");

-- CreateIndex
CREATE UNIQUE INDEX "ResourceContent_resourceId_key" ON "ResourceContent"("resourceId");

-- CreateIndex
CREATE INDEX "AdSession_userId_idx" ON "AdSession"("userId");

-- CreateIndex
CREATE INDEX "AdSession_expiresAt_idx" ON "AdSession"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "AdCompletion_sessionId_key" ON "AdCompletion"("sessionId");

-- CreateIndex
CREATE INDEX "AdCompletion_completed_idx" ON "AdCompletion"("completed");

-- CreateIndex
CREATE INDEX "AdCompletion_paymentProcessed_idx" ON "AdCompletion"("paymentProcessed");

-- CreateIndex
CREATE INDEX "ResourceAccess_userId_idx" ON "ResourceAccess"("userId");

-- CreateIndex
CREATE INDEX "ResourceAccess_resourceId_idx" ON "ResourceAccess"("resourceId");

-- CreateIndex
CREATE INDEX "ResourceAccess_expiresAt_idx" ON "ResourceAccess"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "ChatGPTUser_chatgptUserId_key" ON "ChatGPTUser"("chatgptUserId");

-- CreateIndex
CREATE INDEX "ChatGPTUser_chatgptUserId_idx" ON "ChatGPTUser"("chatgptUserId");

-- CreateIndex
CREATE INDEX "ChatGPTUser_subscriptionTier_idx" ON "ChatGPTUser"("subscriptionTier");

-- CreateIndex
CREATE INDEX "AdPlayback_apiKey_idx" ON "AdPlayback"("apiKey");

-- CreateIndex
CREATE INDEX "AdPlayback_creativeId_idx" ON "AdPlayback"("creativeId");

-- CreateIndex
CREATE INDEX "AdPlayback_status_idx" ON "AdPlayback"("status");

-- CreateIndex
CREATE INDEX "AdPlayback_createdAt_idx" ON "AdPlayback"("createdAt");

-- AddForeignKey
ALTER TABLE "ResourceContent" ADD CONSTRAINT "ResourceContent_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "PremiumResource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdSession" ADD CONSTRAINT "AdSession_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "PremiumResource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdSession" ADD CONSTRAINT "AdSession_adId_fkey" FOREIGN KEY ("adId") REFERENCES "Creative"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdCompletion" ADD CONSTRAINT "AdCompletion_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AdSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceAccess" ADD CONSTRAINT "ResourceAccess_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "PremiumResource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceAccess" ADD CONSTRAINT "ResourceAccess_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AdSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdPlayback" ADD CONSTRAINT "AdPlayback_creativeId_fkey" FOREIGN KEY ("creativeId") REFERENCES "Creative"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
