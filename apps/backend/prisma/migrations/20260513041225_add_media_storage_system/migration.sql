/*
  Warnings:

  - A unique constraint covering the columns `[r2Key]` on the table `Media` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `r2Key` to the `Media` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sizeBytes` to the `Media` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Media` table without a default value. This is not possible if the table is not empty.
  - Added the required column `workspaceId` to the `Media` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `Media` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "MediaSource" AS ENUM ('WHATSAPP_INGESTED', 'BROKER_UPLOAD');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO', 'DOCUMENT');

-- CreateEnum
CREATE TYPE "StorageTier" AS ENUM ('GB_50', 'GB_100');

-- CreateEnum
CREATE TYPE "StorageSubscriptionStatus" AS ENUM ('ACTIVE', 'CANCELLED', 'EXPIRED');

-- AlterTable
ALTER TABLE "Media" ADD COLUMN     "canonicalPropertyId" TEXT,
ADD COLUMN     "countedInQuota" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "isCompressed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isShared" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mimeType" TEXT,
ADD COLUMN     "r2Key" TEXT NOT NULL,
ADD COLUMN     "sizeBytes" BIGINT NOT NULL,
ADD COLUMN     "source" "MediaSource" NOT NULL DEFAULT 'BROKER_UPLOAD',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "uploadedById" TEXT,
ADD COLUMN     "workspaceId" TEXT NOT NULL,
DROP COLUMN "type",
ADD COLUMN     "type" "MediaType" NOT NULL;

-- CreateTable
CREATE TABLE "WorkspaceStorageSubscription" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "tier" "StorageTier" NOT NULL,
    "storageGb" INTEGER NOT NULL,
    "priceMonthly" INTEGER NOT NULL,
    "status" "StorageSubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "gatewaySubscriptionId" TEXT,
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkspaceStorageSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceStorageSubscription_workspaceId_key" ON "WorkspaceStorageSubscription"("workspaceId");

-- CreateIndex
CREATE INDEX "WorkspaceStorageSubscription_workspaceId_idx" ON "WorkspaceStorageSubscription"("workspaceId");

-- CreateIndex
CREATE INDEX "WorkspaceStorageSubscription_status_idx" ON "WorkspaceStorageSubscription"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Media_r2Key_key" ON "Media"("r2Key");

-- CreateIndex
CREATE INDEX "Media_listingId_idx" ON "Media"("listingId");

-- CreateIndex
CREATE INDEX "Media_workspaceId_idx" ON "Media"("workspaceId");

-- CreateIndex
CREATE INDEX "Media_canonicalPropertyId_idx" ON "Media"("canonicalPropertyId");

-- CreateIndex
CREATE INDEX "Media_source_idx" ON "Media"("source");

-- CreateIndex
CREATE INDEX "Media_isShared_idx" ON "Media"("isShared");

-- CreateIndex
CREATE INDEX "Media_deletedAt_idx" ON "Media"("deletedAt");

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_canonicalPropertyId_fkey" FOREIGN KEY ("canonicalPropertyId") REFERENCES "CanonicalProperty"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceStorageSubscription" ADD CONSTRAINT "WorkspaceStorageSubscription_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
