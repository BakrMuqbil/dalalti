import "dotenv/config";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/password";

const rl = readline.createInterface({
  input,
  output,
});

async function main() {
  console.log("\n=== Dalalti Admin Setup ===\n");

  const name = (
    await rl.question("Admin name: ")
  ).trim();

  const phone = (
    await rl.question("Admin phone: ")
  ).trim();

  const emailInput = (
    await rl.question("Admin email (optional): ")
  ).trim();

  const password = await rl.question(
    "Admin password: "
  );

  if (!name || !phone || !password) {
    throw new Error(
      "Name, phone and password are required."
    );
  }

  if (password.length < 8) {
    throw new Error(
      "Password must be at least 8 characters."
    );
  }

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { phone },
        ...(emailInput ? [{ email: emailInput }] : []),
      ],
    },
  });

  if (existingUser) {
    throw new Error(
      "A user with this phone or email already exists."
    );
  }

  const passwordHash = await hashPassword(password);

  const admin = await prisma.user.create({
    data: {
      name,
      phone,
      email: emailInput || null,
      passwordHash,
      role: "ADMIN",
    },
  });

  console.log("\nAdmin created successfully.");
  console.log({
    id: admin.id,
    name: admin.name,
    phone: admin.phone,
    email: admin.email,
    role: admin.role,
  });
}

main()
  .catch((error) => {
    console.error("\nFailed to create admin:");
    console.error(
      error instanceof Error
        ? error.message
        : error
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    rl.close();
    await prisma.$disconnect();
  });