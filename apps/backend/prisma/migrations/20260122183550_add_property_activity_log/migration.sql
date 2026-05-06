-- CreateTable
CREATE TABLE "PropertyActivity" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "oldData" JSONB,
    "newData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PropertyActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PropertyActivity_propertyId_idx" ON "PropertyActivity"("propertyId");

-- AddForeignKey
ALTER TABLE "PropertyActivity" ADD CONSTRAINT "PropertyActivity_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
