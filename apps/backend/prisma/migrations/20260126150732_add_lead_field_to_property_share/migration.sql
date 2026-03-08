-- AlterTable
ALTER TABLE "PropertyShare" ADD COLUMN     "followUpAt" TIMESTAMP(3),
ADD COLUMN     "lastContactedAt" TIMESTAMP(3),
ADD COLUMN     "leadStage" "LeadStage" NOT NULL DEFAULT 'NEW',
ADD COLUMN     "notes" TEXT;
