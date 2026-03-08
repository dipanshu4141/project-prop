/*
  Warnings:

  - You are about to drop the column `tenantPreferences` on the `Property` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "TenantType" AS ENUM ('BACHELORS', 'FAMILY', 'GIRLS', 'BOYS', 'ANY');

-- AlterTable
ALTER TABLE "Property" DROP COLUMN "tenantPreferences",
ADD COLUMN     "tenantRestrictions" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "tenantTypes" "TenantType"[] DEFAULT ARRAY[]::"TenantType"[];
