-- CreateTable
CREATE TABLE "PropertyShare" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetName" TEXT,
    "targetContact" TEXT,
    "leadId" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PropertyShare_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PropertyShare" ADD CONSTRAINT "PropertyShare_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
