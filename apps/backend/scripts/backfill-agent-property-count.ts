import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({
  path: path.resolve(process.cwd(), ".env"),
});

import { PrismaClient } from "@prisma/client";

console.log("DATABASE_URL =", process.env.DATABASE_URL);

const prisma = new PrismaClient();

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

  // Ensure agents with zero properties have 0
  // await prisma.agent.updateMany({
  //   where: { propertyCount: null },
  //   data: { propertyCount: 0 },
  // });

  console.log("✅ Backfill completed successfully");
}

main()
  .catch((err) => {
    console.error("❌ Backfill failed", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
