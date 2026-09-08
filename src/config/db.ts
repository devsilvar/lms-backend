import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Prisma 7: Connection configuration
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL environment variable is not set. " +
    "Locally: check that lms-backend/.env exists and server.ts loads 'dotenv/config'. " +
    "On Render: set DATABASE_URL in the dashboard Environment tab."
  );
}

// Log connection status WITHOUT leaking credentials
console.log(
  `🗄️  DATABASE_URL is set (host: ${new URL(connectionString).host})`
);

// IMPORTANT: `?sslmode=require` inside the connection string OVERRIDES the
// `ssl` option passed to the Pool (pg parses the URL last), so a plain
// `ssl: { rejectUnauthorized: false }` gets ignored. Strip it from the URL
// and control TLS via the explicit `ssl` option instead.
const cleanConnectionString = (() => {
  const url = new URL(connectionString);
  url.searchParams.delete("sslmode");
  return url.toString();
})();

const pool = new Pool({
  connectionString: cleanConnectionString,
  // Aiven Postgres uses its own CA. Verify the server certificate fully by
  // trusting the CA cert bundled at prisma/ca.pem; fall back to skipping
  // chain verification only if the file is missing (scoped to THIS pool only
  // - do NOT use the global NODE_TLS_REJECT_UNAUTHORIZED=0 hack).
  ssl: fs.existsSync(path.join(process.cwd(), "prisma", "ca.pem"))
    ? { ca: fs.readFileSync(path.join(process.cwd(), "prisma", "ca.pem"), "utf8") }
    : { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);

// Prisma 7: Pass adapter to PrismaClient constructor
const prisma = new PrismaClient({ 
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

export default prisma;
