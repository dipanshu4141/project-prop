-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "sender" TEXT;

-- CreateTable
CREATE TABLE "IngestionPhone" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "displayName" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sessionPath" TEXT NOT NULL,
    "qrCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IngestionPhone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngestionGroup" (
    "id" TEXT NOT NULL,
    "groupJid" TEXT NOT NULL,
    "groupName" TEXT NOT NULL,
    "ingestionPhoneId" TEXT NOT NULL,

    CONSTRAINT "IngestionGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupSubscription" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GlobalMessageCache" (
    "id" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "aiResult" JSONB NOT NULL,
    "hitCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GlobalMessageCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IngestionPhone_phone_key" ON "IngestionPhone"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "IngestionGroup_groupJid_ingestionPhoneId_key" ON "IngestionGroup"("groupJid", "ingestionPhoneId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupSubscription_groupId_workspaceId_key" ON "GroupSubscription"("groupId", "workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "GlobalMessageCache_hash_key" ON "GlobalMessageCache"("hash");

-- AddForeignKey
ALTER TABLE "IngestionGroup" ADD CONSTRAINT "IngestionGroup_ingestionPhoneId_fkey" FOREIGN KEY ("ingestionPhoneId") REFERENCES "IngestionPhone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupSubscription" ADD CONSTRAINT "GroupSubscription_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "IngestionGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupSubscription" ADD CONSTRAINT "GroupSubscription_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
