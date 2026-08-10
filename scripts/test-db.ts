import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const result = await prisma.$queryRaw`
    SELECT NOW() AS server_time
  `;

  console.log("Database connection: OK");
  console.log(result);
}

main()
  .catch((error) => {
    console.error("Database connection: FAILED");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
