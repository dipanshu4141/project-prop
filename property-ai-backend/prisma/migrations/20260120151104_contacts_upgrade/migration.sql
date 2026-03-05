-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "agentName" TEXT,
ADD COLUMN     "contacts" TEXT[],
ADD COLUMN     "firmName" TEXT,
ADD COLUMN     "rawContactBlock" TEXT,
ADD COLUMN     "senderContact" TEXT;
