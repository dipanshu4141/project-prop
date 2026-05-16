-- AddForeignKey
ALTER TABLE "PropertyDeal" ADD CONSTRAINT "PropertyDeal_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
