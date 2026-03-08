import { prisma } from "../src/prisma/prisma.client";

async function main() {
  console.log("🔄 Backfilling agent.propertyCount...");

  await prisma.$executeRawUnsafe(`
    UPDATE "Agent" a
    SET "propertyCount" = sub.count
    FROM (
      SELECT "agentId", COUNT(*) AS count
      FROM "PropertyAgent"
      GROUP BY "agentId"
    ) sub
    WHERE a.id = sub."agentId"
  `);

  // await prisma.agent.updateMany({
  //   where: { propertyCount: null },
  //   data: { propertyCount: 0 },
  // });

  console.log("✅ Backfill completed successfully");
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
