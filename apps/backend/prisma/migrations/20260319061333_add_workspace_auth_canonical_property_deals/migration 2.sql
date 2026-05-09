/*
  Warnings:

  - You are about to drop the column `phone` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `propertyId` on the `ClientProperty` table. All the data in the column will be lost.
  - You are about to drop the column `propertyId` on the `IngestionLog` table. All the data in the column will be lost.
  - You are about to drop the column `propertyId` on the `Media` table. All the data in the column will be lost.
  - You are about to drop the column `leadId` on the `PropertyShare` table. All the data in the column will be lost.
  - You are about to drop the column `propertyId` on the `PropertyShare` table. All the data in the column will be lost.
  - You are about to drop the `Property` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PropertyActivity` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PropertyAgent` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TeamMember` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[agentId,phone]` on the table `AgentPhone` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[workspaceId,id]` on the table `Client` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[clientId,listingId]` on the table `ClientProperty` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `workspaceId` to the `Agent` table without a default value. This is not possible if the table is not empty.
  - Added the required column `workspaceId` to the `Client` table without a default value. This is not possible if the table is not empty.
  - Added the required column `listingId` to the `ClientProperty` table without a default value. This is not possible if the table is not empty.
  - Added the required column `listingId` to the `Media` table without a default value. This is not possible if the table is not empty.
  - Added the required column `workspaceId` to the `Message` table without a default value. This is not possible if the table is not empty.
  - Added the required column `listingId` to the `PropertyShare` table without a default value. This is not possible if the table is not empty.
  - Added the required column `workspaceId` to the `PropertyShare` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PlatformRole" AS ENUM ('SUPERADMIN', 'SUPPORT', 'USER');

-- CreateEnum
CREATE TYPE "WorkspaceType" AS ENUM ('INDIVIDUAL', 'FIRM');

-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('OWNER', 'BROKER', 'VIEWER');

-- CreateEnum
CREATE TYPE "InviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'PAUSED');

-- CreateEnum
CREATE TYPE "BillingInterval" AS ENUM ('MONTHLY', 'ANNUAL');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'EMAIL', 'WHATSAPP', 'PUSH');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'READ');

-- CreateEnum
CREATE TYPE "DuplicateConfidence" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CONFIRMED');

-- CreateEnum
CREATE TYPE "DealStatus" AS ENUM ('INITIATED', 'NEGOTIATING', 'AGREED', 'COMPLETED', 'FALLEN_THROUGH', 'DISPUTED');

-- CreateEnum
CREATE TYPE "ChainRole" AS ENUM ('ORIGINATOR', 'CO_LISTER', 'REFERRER', 'CLOSER', 'PLATFORM');

-- CreateEnum
CREATE TYPE "CommissionStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PAID', 'DISPUTED', 'WAIVED');

-- DropForeignKey
ALTER TABLE "ClientProperty" DROP CONSTRAINT "ClientProperty_propertyId_fkey";

-- DropForeignKey
ALTER TABLE "Media" DROP CONSTRAINT "Media_propertyId_fkey";

-- DropForeignKey
ALTER TABLE "Property" DROP CONSTRAINT "Property_messageId_fkey";

-- DropForeignKey
ALTER TABLE "PropertyActivity" DROP CONSTRAINT "PropertyActivity_propertyId_fkey";

-- DropForeignKey
ALTER TABLE "PropertyAgent" DROP CONSTRAINT "PropertyAgent_agentId_fkey";

-- DropForeignKey
ALTER TABLE "PropertyAgent" DROP CONSTRAINT "PropertyAgent_propertyId_fkey";

-- DropForeignKey
ALTER TABLE "PropertyShare" DROP CONSTRAINT "PropertyShare_propertyId_fkey";

-- DropIndex
DROP INDEX "AgentPhone_phone_key";

-- DropIndex
DROP INDEX "Client_phone_key";

-- DropIndex
DROP INDEX "ClientProperty_clientId_propertyId_key";

-- DropIndex
DROP INDEX "IngestionLog_propertyId_idx";

-- AlterTable
ALTER TABLE "Agent" ADD COLUMN     "workspaceId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Client" DROP COLUMN "phone",
ADD COLUMN     "workspaceId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ClientProperty" DROP COLUMN "propertyId",
ADD COLUMN     "listingId" TEXT NOT NULL,
ADD COLUMN     "notes" TEXT;

-- AlterTable
ALTER TABLE "IngestionLog" DROP COLUMN "propertyId",
ADD COLUMN     "listingId" TEXT,
ADD COLUMN     "workspaceId" TEXT;

-- AlterTable
ALTER TABLE "Media" DROP COLUMN "propertyId",
ADD COLUMN     "listingId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "workspaceId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "PropertyShare" DROP COLUMN "leadId",
DROP COLUMN "propertyId",
ADD COLUMN     "clientId" TEXT,
ADD COLUMN     "listingId" TEXT NOT NULL,
ADD COLUMN     "workspaceId" TEXT NOT NULL;

-- DropTable
DROP TABLE "Property";

-- DropTable
DROP TABLE "PropertyActivity";

-- DropTable
DROP TABLE "PropertyAgent";

-- DropTable
DROP TABLE "TeamMember";

-- DropEnum
DROP TYPE "TenantPreference";

-- CreateTable
CREATE TABLE "Workspace" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "WorkspaceType" NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "city" TEXT,
    "logoUrl" TEXT,
    "plan" TEXT NOT NULL DEFAULT 'FREE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "suspendedAt" TIMESTAMP(3),
    "suspendedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "avatarUrl" TEXT,
    "platformRole" "PlatformRole" NOT NULL DEFAULT 'USER',
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifyToken" TEXT,
    "verifyTokenExp" TIMESTAMP(3),
    "resetToken" TEXT,
    "resetTokenExp" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deactivatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceMember" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "MemberRole" NOT NULL DEFAULT 'BROKER',
    "inviteId" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActiveAt" TIMESTAMP(3),

    CONSTRAINT "WorkspaceMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceInvite" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "MemberRole" NOT NULL DEFAULT 'BROKER',
    "token" TEXT NOT NULL,
    "status" "InviteStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "invitedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkspaceInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "deviceName" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CanonicalProperty" (
    "id" TEXT NOT NULL,
    "fingerprint" TEXT,
    "globalRefCode" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "verifiedById" TEXT,
    "masterListingId" TEXT,
    "listingCount" INTEGER NOT NULL DEFAULT 0,
    "totalDealsCompleted" INTEGER NOT NULL DEFAULT 0,
    "lastDealAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CanonicalProperty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceListing" (
    "id" TEXT NOT NULL,
    "canonicalPropertyId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "refCode" TEXT NOT NULL,
    "messageId" TEXT,
    "ownerId" TEXT,
    "listingRole" "ChainRole" NOT NULL DEFAULT 'ORIGINATOR',
    "isChainOrigin" BOOLEAN NOT NULL DEFAULT false,
    "firmName" TEXT,
    "agentName" TEXT,
    "contacts" TEXT[],
    "senderContact" TEXT,
    "rawContactBlock" TEXT,
    "listingType" "ListingType",
    "propertyCategory" "PropertyCategory",
    "propertySubType" "PropertySubType",
    "country" TEXT,
    "city" TEXT,
    "area" TEXT,
    "location" TEXT,
    "areaId" TEXT,
    "price" BIGINT,
    "deposit" BIGINT,
    "bhk" TEXT,
    "areaSqft" INTEGER,
    "furnishing" "FurnishingType",
    "building" TEXT,
    "floor" INTEGER,
    "totalFloors" INTEGER,
    "urgencyLevel" "UrgencyLevel" NOT NULL DEFAULT 'NORMAL',
    "negotiable" BOOLEAN,
    "availableFrom" TIMESTAMP(3),
    "tenantTypes" "TenantType"[] DEFAULT ARRAY[]::"TenantType"[],
    "tenantRestrictions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "brokerType" "BrokerType",
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "PropertyStatus",
    "availability" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "sourceGroup" TEXT,
    "duplicateOf" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "WorkspaceListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DuplicateLink" (
    "id" TEXT NOT NULL,
    "canonicalPropertyId" TEXT NOT NULL,
    "listingAId" TEXT NOT NULL,
    "listingBId" TEXT NOT NULL,
    "confidence" "DuplicateConfidence" NOT NULL,
    "matchReasons" TEXT[],
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" TEXT,
    "confirmed" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DuplicateLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyDeal" (
    "id" TEXT NOT NULL,
    "canonicalPropertyId" TEXT NOT NULL,
    "initiatorListingId" TEXT NOT NULL,
    "clientId" TEXT,
    "status" "DealStatus" NOT NULL DEFAULT 'INITIATED',
    "dealValue" BIGINT,
    "totalCommission" BIGINT,
    "commissionRate" DOUBLE PRECISION,
    "initiatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "agreedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "fallenAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyDeal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealChainLink" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "listingId" TEXT,
    "role" "ChainRole" NOT NULL,
    "position" INTEGER NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "addedBy" TEXT,
    "notes" TEXT,

    CONSTRAINT "DealChainLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommissionSplit" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "chainLinkId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "amount" BIGINT,
    "status" "CommissionStatus" NOT NULL DEFAULT 'PENDING',
    "invoiceRef" TEXT,
    "paidAt" TIMESTAMP(3),
    "paidById" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommissionSplit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "workspaceId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "before" JSONB,
    "after" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "requestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImpersonationLog" (
    "id" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "targetWorkspaceId" TEXT NOT NULL,
    "reason" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "ipAddress" TEXT,

    CONSTRAINT "ImpersonationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIALING',
    "interval" "BillingInterval" NOT NULL DEFAULT 'MONTHLY',
    "gatewayCustomerId" TEXT,
    "gatewaySubscriptionId" TEXT,
    "seats" INTEGER NOT NULL DEFAULT 1,
    "seatsUsed" INTEGER NOT NULL DEFAULT 1,
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "trialEndsAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" TEXT NOT NULL,
    "gatewayInvoiceId" TEXT,
    "gatewayPaymentId" TEXT,
    "paidAt" TIMESTAMP(3),
    "dueAt" TIMESTAMP(3),
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeatureFlag" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeatureFlag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeatureFlagOverride" (
    "id" TEXT NOT NULL,
    "flagId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL,

    CONSTRAINT "FeatureFlagOverride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workspaceId" TEXT,
    "channel" "NotificationChannel" NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "actionUrl" TEXT,
    "sentAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "failReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageEvent" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT,
    "event" TEXT NOT NULL,
    "properties" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsageEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Area" (
    "id" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "aliases" TEXT[],
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "pincode" TEXT,

    CONSTRAINT "Area_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingAgent" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,

    CONSTRAINT "ListingAgent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingActivity" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "oldData" JSONB,
    "newData" JSONB,
    "userId" TEXT,
    "userName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ListingActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientPhone" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "label" TEXT,
    "primary" BOOLEAN NOT NULL DEFAULT false,
    "clientId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientPhone_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Workspace_slug_key" ON "Workspace"("slug");

-- CreateIndex
CREATE INDEX "Workspace_type_idx" ON "Workspace"("type");

-- CreateIndex
CREATE INDEX "Workspace_plan_idx" ON "Workspace"("plan");

-- CreateIndex
CREATE INDEX "Workspace_createdAt_idx" ON "Workspace"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_verifyToken_key" ON "User"("verifyToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_resetToken_key" ON "User"("resetToken");

-- CreateIndex
CREATE INDEX "User_platformRole_idx" ON "User"("platformRole");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE INDEX "WorkspaceMember_workspaceId_idx" ON "WorkspaceMember"("workspaceId");

-- CreateIndex
CREATE INDEX "WorkspaceMember_userId_idx" ON "WorkspaceMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceMember_workspaceId_userId_key" ON "WorkspaceMember"("workspaceId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceInvite_token_key" ON "WorkspaceInvite"("token");

-- CreateIndex
CREATE INDEX "WorkspaceInvite_workspaceId_idx" ON "WorkspaceInvite"("workspaceId");

-- CreateIndex
CREATE INDEX "WorkspaceInvite_token_idx" ON "WorkspaceInvite"("token");

-- CreateIndex
CREATE INDEX "WorkspaceInvite_email_idx" ON "WorkspaceInvite"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserSession_refreshToken_key" ON "UserSession"("refreshToken");

-- CreateIndex
CREATE INDEX "UserSession_userId_idx" ON "UserSession"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CanonicalProperty_fingerprint_key" ON "CanonicalProperty"("fingerprint");

-- CreateIndex
CREATE UNIQUE INDEX "CanonicalProperty_globalRefCode_key" ON "CanonicalProperty"("globalRefCode");

-- CreateIndex
CREATE UNIQUE INDEX "CanonicalProperty_masterListingId_key" ON "CanonicalProperty"("masterListingId");

-- CreateIndex
CREATE INDEX "CanonicalProperty_fingerprint_idx" ON "CanonicalProperty"("fingerprint");

-- CreateIndex
CREATE INDEX "CanonicalProperty_verified_idx" ON "CanonicalProperty"("verified");

-- CreateIndex
CREATE INDEX "CanonicalProperty_createdAt_idx" ON "CanonicalProperty"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceListing_refCode_key" ON "WorkspaceListing"("refCode");

-- CreateIndex
CREATE INDEX "WorkspaceListing_workspaceId_idx" ON "WorkspaceListing"("workspaceId");

-- CreateIndex
CREATE INDEX "WorkspaceListing_canonicalPropertyId_idx" ON "WorkspaceListing"("canonicalPropertyId");

-- CreateIndex
CREATE INDEX "WorkspaceListing_workspaceId_status_idx" ON "WorkspaceListing"("workspaceId", "status");

-- CreateIndex
CREATE INDEX "WorkspaceListing_workspaceId_createdAt_idx" ON "WorkspaceListing"("workspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "WorkspaceListing_areaId_idx" ON "WorkspaceListing"("areaId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceListing_workspaceId_canonicalPropertyId_key" ON "WorkspaceListing"("workspaceId", "canonicalPropertyId");

-- CreateIndex
CREATE INDEX "DuplicateLink_canonicalPropertyId_idx" ON "DuplicateLink"("canonicalPropertyId");

-- CreateIndex
CREATE INDEX "DuplicateLink_listingAId_idx" ON "DuplicateLink"("listingAId");

-- CreateIndex
CREATE INDEX "DuplicateLink_listingBId_idx" ON "DuplicateLink"("listingBId");

-- CreateIndex
CREATE INDEX "PropertyDeal_canonicalPropertyId_idx" ON "PropertyDeal"("canonicalPropertyId");

-- CreateIndex
CREATE INDEX "PropertyDeal_status_idx" ON "PropertyDeal"("status");

-- CreateIndex
CREATE INDEX "PropertyDeal_initiatedAt_idx" ON "PropertyDeal"("initiatedAt");

-- CreateIndex
CREATE INDEX "DealChainLink_dealId_idx" ON "DealChainLink"("dealId");

-- CreateIndex
CREATE INDEX "DealChainLink_workspaceId_idx" ON "DealChainLink"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "DealChainLink_dealId_workspaceId_key" ON "DealChainLink"("dealId", "workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "DealChainLink_dealId_position_key" ON "DealChainLink"("dealId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "CommissionSplit_chainLinkId_key" ON "CommissionSplit"("chainLinkId");

-- CreateIndex
CREATE INDEX "CommissionSplit_dealId_idx" ON "CommissionSplit"("dealId");

-- CreateIndex
CREATE INDEX "CommissionSplit_workspaceId_idx" ON "CommissionSplit"("workspaceId");

-- CreateIndex
CREATE INDEX "CommissionSplit_status_idx" ON "CommissionSplit"("status");

-- CreateIndex
CREATE INDEX "AuditLog_workspaceId_idx" ON "AuditLog"("workspaceId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "ImpersonationLog_adminUserId_idx" ON "ImpersonationLog"("adminUserId");

-- CreateIndex
CREATE INDEX "ImpersonationLog_targetUserId_idx" ON "ImpersonationLog"("targetUserId");

-- CreateIndex
CREATE INDEX "ImpersonationLog_targetWorkspaceId_idx" ON "ImpersonationLog"("targetWorkspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_workspaceId_key" ON "Subscription"("workspaceId");

-- CreateIndex
CREATE INDEX "Invoice_workspaceId_idx" ON "Invoice"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "FeatureFlag_key_key" ON "FeatureFlag"("key");

-- CreateIndex
CREATE INDEX "FeatureFlagOverride_workspaceId_idx" ON "FeatureFlagOverride"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "FeatureFlagOverride_flagId_workspaceId_key" ON "FeatureFlagOverride"("flagId", "workspaceId");

-- CreateIndex
CREATE INDEX "Notification_userId_status_idx" ON "Notification"("userId", "status");

-- CreateIndex
CREATE INDEX "Notification_workspaceId_idx" ON "Notification"("workspaceId");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "UsageEvent_workspaceId_event_idx" ON "UsageEvent"("workspaceId", "event");

-- CreateIndex
CREATE INDEX "UsageEvent_workspaceId_occurredAt_idx" ON "UsageEvent"("workspaceId", "occurredAt");

-- CreateIndex
CREATE INDEX "UsageEvent_event_occurredAt_idx" ON "UsageEvent"("event", "occurredAt");

-- CreateIndex
CREATE INDEX "UsageEvent_userId_occurredAt_idx" ON "UsageEvent"("userId", "occurredAt");

-- CreateIndex
CREATE INDEX "Area_city_idx" ON "Area"("city");

-- CreateIndex
CREATE UNIQUE INDEX "Area_city_name_key" ON "Area"("city", "name");

-- CreateIndex
CREATE UNIQUE INDEX "ListingAgent_listingId_agentId_key" ON "ListingAgent"("listingId", "agentId");

-- CreateIndex
CREATE INDEX "ListingActivity_listingId_idx" ON "ListingActivity"("listingId");

-- CreateIndex
CREATE INDEX "ListingActivity_createdAt_idx" ON "ListingActivity"("createdAt");

-- CreateIndex
CREATE INDEX "ClientPhone_phone_idx" ON "ClientPhone"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "ClientPhone_clientId_phone_key" ON "ClientPhone"("clientId", "phone");

-- CreateIndex
CREATE INDEX "Agent_workspaceId_idx" ON "Agent"("workspaceId");

-- CreateIndex
CREATE INDEX "AgentPhone_phone_idx" ON "AgentPhone"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "AgentPhone_agentId_phone_key" ON "AgentPhone"("agentId", "phone");

-- CreateIndex
CREATE INDEX "Client_workspaceId_idx" ON "Client"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "Client_workspaceId_id_key" ON "Client"("workspaceId", "id");

-- CreateIndex
CREATE INDEX "ClientEvent_clientId_createdAt_idx" ON "ClientEvent"("clientId", "createdAt");

-- CreateIndex
CREATE INDEX "ClientProperty_listingId_idx" ON "ClientProperty"("listingId");

-- CreateIndex
CREATE INDEX "ClientProperty_followUpAt_idx" ON "ClientProperty"("followUpAt");

-- CreateIndex
CREATE UNIQUE INDEX "ClientProperty_clientId_listingId_key" ON "ClientProperty"("clientId", "listingId");

-- CreateIndex
CREATE INDEX "IngestionLog_workspaceId_idx" ON "IngestionLog"("workspaceId");

-- CreateIndex
CREATE INDEX "IngestionLog_listingId_idx" ON "IngestionLog"("listingId");

-- CreateIndex
CREATE INDEX "IngestionLog_createdAt_idx" ON "IngestionLog"("createdAt");

-- CreateIndex
CREATE INDEX "Message_workspaceId_idx" ON "Message"("workspaceId");

-- CreateIndex
CREATE INDEX "Message_workspaceId_receivedAt_idx" ON "Message"("workspaceId", "receivedAt");

-- CreateIndex
CREATE INDEX "PropertyShare_workspaceId_idx" ON "PropertyShare"("workspaceId");

-- CreateIndex
CREATE INDEX "PropertyShare_listingId_idx" ON "PropertyShare"("listingId");

-- AddForeignKey
ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceInvite" ADD CONSTRAINT "WorkspaceInvite_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceInvite" ADD CONSTRAINT "WorkspaceInvite_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceListing" ADD CONSTRAINT "WorkspaceListing_canonicalPropertyId_fkey" FOREIGN KEY ("canonicalPropertyId") REFERENCES "CanonicalProperty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceListing" ADD CONSTRAINT "WorkspaceListing_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceListing" ADD CONSTRAINT "WorkspaceListing_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceListing" ADD CONSTRAINT "WorkspaceListing_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DuplicateLink" ADD CONSTRAINT "DuplicateLink_canonicalPropertyId_fkey" FOREIGN KEY ("canonicalPropertyId") REFERENCES "CanonicalProperty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyDeal" ADD CONSTRAINT "PropertyDeal_canonicalPropertyId_fkey" FOREIGN KEY ("canonicalPropertyId") REFERENCES "CanonicalProperty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealChainLink" ADD CONSTRAINT "DealChainLink_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "PropertyDeal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealChainLink" ADD CONSTRAINT "DealChainLink_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionSplit" ADD CONSTRAINT "CommissionSplit_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "PropertyDeal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionSplit" ADD CONSTRAINT "CommissionSplit_chainLinkId_fkey" FOREIGN KEY ("chainLinkId") REFERENCES "DealChainLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImpersonationLog" ADD CONSTRAINT "ImpersonationLog_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImpersonationLog" ADD CONSTRAINT "ImpersonationLog_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeatureFlagOverride" ADD CONSTRAINT "FeatureFlagOverride_flagId_fkey" FOREIGN KEY ("flagId") REFERENCES "FeatureFlag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeatureFlagOverride" ADD CONSTRAINT "FeatureFlagOverride_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingAgent" ADD CONSTRAINT "ListingAgent_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "WorkspaceListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingAgent" ADD CONSTRAINT "ListingAgent_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "WorkspaceListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingActivity" ADD CONSTRAINT "ListingActivity_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "WorkspaceListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyShare" ADD CONSTRAINT "PropertyShare_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "WorkspaceListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientPhone" ADD CONSTRAINT "ClientPhone_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientProperty" ADD CONSTRAINT "ClientProperty_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "WorkspaceListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
