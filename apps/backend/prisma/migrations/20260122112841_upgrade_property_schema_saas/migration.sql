/*
  Warnings:

  - You are about to drop the column `contact` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Property` table. All the data in the column will be lost.
  - The `furnishing` column on the `Property` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `brokerType` column on the `Property` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `Property` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "ListingType" AS ENUM ('RENT', 'SALE');

-- CreateEnum
CREATE TYPE "PropertyCategory" AS ENUM ('RESIDENTIAL', 'COMMERCIAL');

-- CreateEnum
CREATE TYPE "PropertySubType" AS ENUM ('APARTMENT', 'VILLA', 'OFFICE', 'SHOP', 'WAREHOUSE', 'SHOWROOM', 'PLOT', 'OTHER');

-- CreateEnum
CREATE TYPE "FurnishingType" AS ENUM ('UNFURNISHED', 'SEMI_FURNISHED', 'FULLY_FURNISHED');

-- CreateEnum
CREATE TYPE "UrgencyLevel" AS ENUM ('NORMAL', 'URGENT', 'VERY_URGENT');

-- CreateEnum
CREATE TYPE "PropertyStatus" AS ENUM ('NEW', 'REVIEW', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "BrokerType" AS ENUM ('OWNER', 'BROKER', 'BUILDER');

-- CreateEnum
CREATE TYPE "TenantPreference" AS ENUM ('HINDU_ONLY', 'MUSLIM_ONLY', 'VEG_ONLY', 'NO_SMOKING', 'FAMILY_ONLY', 'BACHELORS_ALLOWED', 'COMPANY_LEASE_ONLY');

-- AlterTable
ALTER TABLE "Property" DROP COLUMN "contact",
DROP COLUMN "type",
ADD COLUMN     "area" TEXT,
ADD COLUMN     "availableFrom" TIMESTAMP(3),
ADD COLUMN     "city" TEXT,
ADD COLUMN     "converted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "duplicateOf" TEXT,
ADD COLUMN     "floor" INTEGER,
ADD COLUMN     "lastContactedAt" TIMESTAMP(3),
ADD COLUMN     "listingType" "ListingType",
ADD COLUMN     "negotiable" BOOLEAN,
ADD COLUMN     "propertyCategory" "PropertyCategory",
ADD COLUMN     "propertySubType" "PropertySubType",
ADD COLUMN     "sourceGroup" TEXT,
ADD COLUMN     "tenantPreferences" "TenantPreference"[],
ADD COLUMN     "totalFloors" INTEGER,
ADD COLUMN     "urgencyLevel" "UrgencyLevel" NOT NULL DEFAULT 'NORMAL',
DROP COLUMN "furnishing",
ADD COLUMN     "furnishing" "FurnishingType",
DROP COLUMN "brokerType",
ADD COLUMN     "brokerType" "BrokerType",
DROP COLUMN "status",
ADD COLUMN     "status" "PropertyStatus";
