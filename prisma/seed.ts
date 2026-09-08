import fs from "node:fs";
import path from "node:path";
import 'dotenv/config';
import { PrismaClient, Role } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

// Prisma 7: Setup connection for seed script
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// `?sslmode=require` in the URL overrides the ssl option, so strip it and
// control TLS explicitly (Aiven uses a self-signed CA)
const cleanConnectionString = (() => {
  const url = new URL(connectionString);
  url.searchParams.delete("sslmode");
  return url.toString();
})();

const pool = new Pool({
  connectionString: cleanConnectionString,
  // Trust the Aiven CA if bundled, otherwise skip chain verification
  ssl: fs.existsSync(path.join(process.cwd(), "prisma", "ca.pem"))
    ? { ca: fs.readFileSync(path.join(process.cwd(), "prisma", "ca.pem"), "utf8") }
    : { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminPassword = await bcrypt.hash("admin123" , 12);

  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      passwordHash: adminPassword,
      role: Role.ADMIN,
    },
  });

  console.log("✅ Admin user seeded");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
