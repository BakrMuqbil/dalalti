import fs from "node:fs";
import pg from "pg";
import "dotenv/config";

const { Client } = pg;

const sql = fs.readFileSync(
  "database/migrations/001_initial.sql",
  "utf8"
);

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

try {
  console.log("Connecting to Supabase...");

  await client.connect();

  console.log("Connected.");
  console.log("Running 001_initial.sql...");

  await client.query(sql);

  console.log("Migration completed successfully.");
} catch (error) {
  console.error("Migration failed:");
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
