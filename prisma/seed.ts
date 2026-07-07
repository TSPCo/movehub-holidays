import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL || "admin@move-hub.co.uk";
  const password = process.env.SEED_ADMIN_PASSWORD || "changeme123";

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin user ${email} already exists — skipping.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await db.user.create({
    data: {
      name: "Admin",
      email,
      passwordHash,
      role: "ADMIN",
      allowanceDays: 25,
    },
  });

  console.log(`Created admin user: ${email} / ${password}`);
  console.log("Log in and change this password via the Admin > Staff page.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
