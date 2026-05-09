-- CreateEnum
CREATE TYPE "LeadStage" AS ENUM ('NEW', 'CONTACTED', 'VISIT', 'NEGOTIATION', 'CLOSED', 'LOST');

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "followUpAt" TIMESTAMP(3),
ADD COLUMN     "leadStage" "LeadStage" NOT NULL DEFAULT 'NEW',
ADD COLUMN     "updatedAt" TIMESTAMP(3);
