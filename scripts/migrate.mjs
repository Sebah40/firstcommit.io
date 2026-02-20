import pg from "pg";
import { readFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, "../supabase/migrations");

// Get all migration files sorted by name
const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

// Allow running a specific migration: node scripts/migrate.mjs <conn> [filename]
const targetFile = process.argv[3];

const toRun = targetFile
  ? files.filter((f) => f.includes(targetFile))
  : files;

if (toRun.length === 0) {
  console.error("No migration files found matching:", targetFile);
  process.exit(1);
}

const client = new pg.Client({
  connectionString: process.argv[2],
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  console.log("Connected.\n");

  for (const file of toRun) {
    const sql = readFileSync(join(migrationsDir, file), "utf-8");
    console.log(`Running ${file}...`);
    await client.query(sql);
    console.log(`  Done.\n`);
  }

  console.log("All migrations complete!");
} catch (err) {
  console.error("Migration failed:", err.message);
  process.exit(1);
} finally {
  await client.end();
}
