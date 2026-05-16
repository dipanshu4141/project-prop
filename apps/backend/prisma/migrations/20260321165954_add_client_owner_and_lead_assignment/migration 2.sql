-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "ownerId" TEXT;

-- AlterTable
ALTER TABLE "ClientProperty" ADD COLUMN     "assignedTo" TEXT;

-- CreateIndex
CREATE INDEX "Client_workspaceId_ownerId_idx" ON "Client"("workspaceId", "ownerId");

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
