-- AddForeignKey
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_mergedIntoId_fkey" FOREIGN KEY ("mergedIntoId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
