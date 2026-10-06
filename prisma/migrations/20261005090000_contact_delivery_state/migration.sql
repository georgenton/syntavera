CREATE TYPE "ContactNotificationStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'FAILED', 'NOT_REQUIRED');

ALTER TABLE "ContactSubmission"
  ADD COLUMN "requestKey" UUID,
  ADD COLUMN "notificationStatus" "ContactNotificationStatus" NOT NULL DEFAULT 'NOT_REQUIRED',
  ADD COLUMN "notificationAttempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "notificationLastAttemptAt" TIMESTAMP(3),
  ADD COLUMN "notificationSentAt" TIMESTAMP(3),
  ADD COLUMN "notificationLastErrorCode" TEXT;

ALTER TABLE "ContactSubmission" ALTER COLUMN "notificationStatus" SET DEFAULT 'PENDING';

CREATE UNIQUE INDEX "ContactSubmission_requestKey_key" ON "ContactSubmission"("requestKey");
