import { prisma } from "../lib/prisma";

async function main() {
  const stores = await prisma.store.findMany({
    include: {
      owner: true,
      subscription: true,
    },
  });

  const users = await prisma.user.findMany();

  const subscriptions = await prisma.subscription.findMany();

  console.log("\n=== STORES ===");
  console.dir(
    stores.map((store: typeof stores[0]) => ({
      id: store.id,
      name: store.name,
      slug: store.slug,
      status: store.status,
      owner: store.owner.name,
      subscription: store.subscription?.status ?? null,
    })),
    { depth: null }
  );

  console.log("\n=== USERS ===");
  console.dir(
    users.map((user: typeof users[0]) => ({
      id: user.id,
      name: user.name,
      role: user.role,
    })),
    { depth: null }
  );

  console.log("\n=== SUBSCRIPTIONS ===");
  console.dir(
    subscriptions.map((subscription: typeof subscriptions[0]) => ({
      id: subscription.id,
      storeId: subscription.storeId,
      status: subscription.status,
      startsAt: subscription.startsAt,
      endsAt: subscription.endsAt,
    })),
    { depth: null }
  );

  console.log("\n=== COUNTS ===");
  console.log({
    stores: await prisma.store.count(),
    activeStores: await prisma.store.count({
      where: { status: "ACTIVE" },
    }),
    storeOwners: await prisma.user.count({
      where: { role: "STORE_OWNER" },
    }),
    activeSubscriptions: await prisma.subscription.count({
      where: { status: "ACTIVE" },
    }),
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
