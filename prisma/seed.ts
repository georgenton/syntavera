import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "better-auth/crypto";
import { PrismaClient } from "../src/generated/prisma/client";

async function main() {
  if (process.env.ALLOW_DEMO_SEED !== "true") throw new Error("Refusing to seed: set ALLOW_DEMO_SEED=true for an isolated local database");
  const databaseUrl = process.env.DATABASE_URL;
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  const name = process.env.SEED_ADMIN_NAME?.trim() || "Administrador local";
  if (!databaseUrl || !email || !password || password.length < 12) throw new Error("DATABASE_URL, SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD (12+ chars) are required");

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
  try {
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.upsert({
      where: { email },
      create: { name, email, emailVerified: true, kind: "INTERNAL", internalRole: "ADMIN" },
      update: { name, emailVerified: true, kind: "INTERNAL", internalRole: "ADMIN", disabledAt: null },
    });
    await prisma.account.upsert({
      where: { providerId_accountId: { providerId: "credential", accountId: user.id } },
      create: { providerId: "credential", accountId: user.id, userId: user.id, password: passwordHash },
      update: { password: passwordHash },
    });
    process.stdout.write(`Local administrator ready: ${email}\n`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : "Seed failed"}\n`);
  process.exitCode = 1;
});
