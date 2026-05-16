-- CreateEnum
CREATE TYPE "ClientPropertyStatus" AS ENUM ('PENDING', 'INTERESTED', 'NOT_INTERESTED', 'SHORTLISTED');

-- AlterTable
ALTER TABLE "ClientProperty" ADD COLUMN     "clientStatus" "ClientPropertyStatus" NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "ClientShareToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "viewedAt" TIMESTAMP(3),

    CONSTRAINT "ClientShareToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClientShareToken_token_key" ON "ClientShareToken"("token");

-- CreateIndex
CREATE INDEX "ClientShareToken_clientId_idx" ON "ClientShareToken"("clientId");

-- CreateIndex
CREATE INDEX "ClientShareToken_workspaceId_idx" ON "ClientShareToken"("workspaceId");

-- AddForeignKey
ALTER TABLE "ClientShareToken" ADD CONSTRAINT "ClientShareToken_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientShareToken" ADD CONSTRAINT "ClientShareToken_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
