import { prisma } from "../lib/prisma";

async function main() {
  const monthly = await prisma.plan.upsert({
    where: {
      name_billingPeriod: {
        name: "الباقة الشهرية",
        billingPeriod: "MONTHLY",
      },
    },
    update: {
      price: 50,
      isActive: true,
    },
    create: {
      name: "الباقة الشهرية",
      billingPeriod: "MONTHLY",
      price: 50,
      isActive: true,
    },
  });

  const yearly = await prisma.plan.upsert({
    where: {
      name_billingPeriod: {
        name: "الباقة السنوية",
        billingPeriod: "YEARLY",
      },
    },
    update: {
      price: 500,
      isActive: true,
    },
    create: {
      name: "الباقة السنوية",
      billingPeriod: "YEARLY",
      price: 500,
      isActive: true,
    },
  });

  console.log("Plans created/updated successfully.");

  console.log({
    monthly: {
      id: monthly.id,
      name: monthly.name,
      price: monthly.price.toString(),
      billingPeriod: monthly.billingPeriod,
    },
    yearly: {
      id: yearly.id,
      name: yearly.name,
      price: yearly.price.toString(),
      billingPeriod: yearly.billingPeriod,
    },
  });
}

main()
  .catch((error) => {
    console.error("Failed to seed plans:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
