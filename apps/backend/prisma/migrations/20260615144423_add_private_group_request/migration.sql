-- AlterTable
ALTER TABLE "IngestionGroup" ADD COLUMN     "isPrivate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "workspaceId" TEXT;

-- CreateTable
CREATE TABLE "PrivateGroupRequest" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "groupJid" TEXT,
    "groupName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrivateGroupRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PrivateGroupRequest_code_key" ON "PrivateGroupRequest"("code");

-- CreateIndex
CREATE INDEX "PrivateGroupRequest_workspaceId_idx" ON "PrivateGroupRequest"("workspaceId");

-- CreateIndex
CREATE INDEX "PrivateGroupRequest_code_idx" ON "PrivateGroupRequest"("code");

-- CreateIndex
CREATE INDEX "PrivateGroupRequest_status_idx" ON "PrivateGroupRequest"("status");

-- AddForeignKey
ALTER TABLE "PrivateGroupRequest" ADD CONSTRAINT "PrivateGroupRequest_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
