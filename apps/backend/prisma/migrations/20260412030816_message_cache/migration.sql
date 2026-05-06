-- CreateTable
CREATE TABLE "message_cache" (
    "id" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_cache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "message_cache_hash_key" ON "message_cache"("hash");

-- CreateIndex
CREATE INDEX "message_cache_workspaceId_idx" ON "message_cache"("workspaceId");
