-- CreateTable
CREATE TABLE "IngestionLog" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT,
    "level" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IngestionLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IngestionLog_propertyId_idx" ON "IngestionLog"("propertyId");

-- CreateIndex
CREATE INDEX "IngestionLog_code_idx" ON "IngestionLog"("code");
