import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";
import { persistContactSubmission } from "../../src/modules/contact/persistence-core";

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const databaseUrl = process.env.DATABASE_URL;
invariant(databaseUrl, "DATABASE_URL is required");

const parsedUrl = new URL(databaseUrl);
invariant(["127.0.0.1", "localhost", "::1"].includes(parsedUrl.hostname), "Refusing to run outside localhost");
invariant(parsedUrl.pathname.includes("review"), "Refusing to run against a database without 'review' in its name");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
const historicalIds = [
  "00000000-0000-4000-8000-000000000101",
  "00000000-0000-4000-8000-000000000102",
];
const concurrentRequestKey = "00000000-0000-4000-8000-000000000201";

async function main() {
try {
  const historical = await prisma.contactSubmission.findMany({
    where: { id: { in: historicalIds } },
    orderBy: { id: "asc" },
  });
  invariant(historical.length === 2, "Historical submissions were not preserved");
  invariant(historical.every((row) => row.requestKey === null), "Historical request keys must remain null");
  invariant(historical.every((row) => row.notificationStatus === "NOT_REQUIRED"), "Historical notifications must not be queued");
  invariant(historical.every((row) => row.notificationAttempts === 0), "Historical notification attempts must remain zero");

  const legacyCompatible = await prisma.contactSubmission.create({
    data: {
      name: "Compatibilidad sintética",
      email: "compatibilidad@example.invalid",
      context: "Registro sintético creado sin los campos nuevos.",
      privacyVersion: "review-legacy",
      privacyAcceptedAt: new Date("2026-10-05T12:00:00.000Z"),
    },
  });
  invariant(legacyCompatible.notificationStatus === "PENDING", "The expanded schema default must be PENDING for new rows");

  const createConcurrent = () => prisma.contactSubmission.create({
    data: {
      requestKey: concurrentRequestKey,
      name: "Concurrencia sintética",
      email: "concurrencia@example.invalid",
      context: "Solicitud sintética para comprobar idempotencia concurrente.",
      privacyVersion: "review-current",
      privacyAcceptedAt: new Date("2026-10-05T12:05:00.000Z"),
    },
    select: { id: true },
  });
  const findConcurrent = () => prisma.contactSubmission.findUnique({
    where: { requestKey: concurrentRequestKey },
    select: { id: true },
  });

  const concurrent = await Promise.all([
    persistContactSubmission(createConcurrent, findConcurrent),
    persistContactSubmission(createConcurrent, findConcurrent),
  ]);
  invariant(concurrent.filter((result) => result.outcome === "created").length === 1, "Exactly one concurrent request must be created");
  invariant(concurrent.filter((result) => result.outcome === "duplicate").length === 1, "The other concurrent request must resolve as duplicate");
  invariant(await prisma.contactSubmission.count({ where: { requestKey: concurrentRequestKey } }) === 1, "Concurrent requests produced duplicate rows");

  const repeated = await persistContactSubmission(createConcurrent, findConcurrent);
  invariant(repeated.outcome === "duplicate", "A repeated request must resolve to the existing receipt");
  invariant(await prisma.contactSubmission.count({ where: { requestKey: concurrentRequestKey } }) === 1, "A repeated request duplicated the row");

  const created = await prisma.contactSubmission.findUniqueOrThrow({ where: { requestKey: concurrentRequestKey } });
  invariant(created.notificationStatus === "PENDING", "A new request must start with a pending notification");
  invariant(created.notificationAttempts === 0, "Migration verification must not trigger notification attempts");

  process.stdout.write(`${JSON.stringify({
    historicalRowsPreserved: historical.length,
    historicalNotificationStatus: [...new Set(historical.map((row) => row.notificationStatus))],
    legacyCompatibleCreate: true,
    concurrentOutcomes: concurrent.map((result) => result.outcome).sort(),
    rowsForConcurrentRequestKey: 1,
    repeatedOutcome: repeated.outcome,
    newNotificationStatus: created.notificationStatus,
    notificationAttempts: created.notificationAttempts,
  }, null, 2)}\n`);
} finally {
  await prisma.$disconnect();
}
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
  process.exitCode = 1;
});
