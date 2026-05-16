-- CreateEnum
CREATE TYPE "ShortlistStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateTable
CREATE TABLE "SavedCollection" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "emoji" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedCollection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedCollectionItem" (
    "id" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedCollectionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientShortlist" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "name" TEXT,
    "status" "ShortlistStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientShortlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientShortlistItem" (
    "id" TEXT NOT NULL,
    "shortlistId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "sentAt" TIMESTAMP(3),

    CONSTRAINT "ClientShortlistItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SavedCollection_workspaceId_createdById_idx" ON "SavedCollection"("workspaceId", "createdById");

-- CreateIndex
CREATE INDEX "SavedCollectionItem_collectionId_idx" ON "SavedCollectionItem"("collectionId");

-- CreateIndex
CREATE UNIQUE INDEX "SavedCollectionItem_collectionId_listingId_key" ON "SavedCollectionItem"("collectionId", "listingId");

-- CreateIndex
CREATE INDEX "ClientShortlist_workspaceId_createdById_idx" ON "ClientShortlist"("workspaceId", "createdById");

-- CreateIndex
CREATE INDEX "ClientShortlist_clientId_idx" ON "ClientShortlist"("clientId");

-- CreateIndex
CREATE INDEX "ClientShortlistItem_shortlistId_idx" ON "ClientShortlistItem"("shortlistId");

-- CreateIndex
CREATE UNIQUE INDEX "ClientShortlistItem_shortlistId_listingId_key" ON "ClientShortlistItem"("shortlistId", "listingId");

-- AddForeignKey
ALTER TABLE "SavedCollectionItem" ADD CONSTRAINT "SavedCollectionItem_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "SavedCollection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedCollectionItem" ADD CONSTRAINT "SavedCollectionItem_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "WorkspaceListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientShortlist" ADD CONSTRAINT "ClientShortlist_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientShortlistItem" ADD CONSTRAINT "ClientShortlistItem_shortlistId_fkey" FOREIGN KEY ("shortlistId") REFERENCES "ClientShortlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientShortlistItem" ADD CONSTRAINT "ClientShortlistItem_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "WorkspaceListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
