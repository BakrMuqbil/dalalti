import { prisma } from "../lib/prisma";

async function main() {
  const plans = await prisma.plan.findMany({
    orderBy: {
      price: "asc",
    },
  });

  console.log(
    plans.map((plan) => ({
      id: plan.id,
      name: plan.name,
      price: plan.price.toString(),
      period: plan.billingPeriod,
    }))
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
