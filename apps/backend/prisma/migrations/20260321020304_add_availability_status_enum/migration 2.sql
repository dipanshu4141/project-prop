/*
  Warnings:

  - The `availability` column on the `WorkspaceListing` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "AvailabilityStatus" AS ENUM ('AVAILABLE', 'UNDER_NEGOTIATION', 'CLOSED', 'ON_HOLD');

-- AlterTable
ALTER TABLE "WorkspaceListing" DROP COLUMN "availability",
ADD COLUMN     "availability" "AvailabilityStatus" NOT NULL DEFAULT 'AVAILABLE';
