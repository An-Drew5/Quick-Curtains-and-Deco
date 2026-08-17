import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Use the session pooler DIRECT_URL for Prisma
const directUrl = process.env.DIRECT_URL;
if (!directUrl) {
  console.error("DIRECT_URL is not set");
  process.exit(2);
}
// Ensure Prisma picks up the direct URL
process.env.DATABASE_URL = directUrl;

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    console.log("Connected using DIRECT_URL");
    const tables = await prisma.$queryRawUnsafe(
      "SELECT table_schema, table_name FROM information_schema.tables WHERE table_name ILIKE '%prisma%' ORDER BY table_schema, table_name;",
    );
    console.log("Prisma-related tables:");
    console.dir(tables, { depth: null });

    // Check for _prisma_migrations
    const migrations = await prisma.$queryRawUnsafe(
      "SELECT * FROM public._prisma_migrations ORDER BY finished_at DESC LIMIT 20;",
    );
    console.log("_prisma_migrations rows:");
    console.dir(migrations, { depth: null });
  } catch (e) {
    console.error("Error querying DB:", e.message || e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
