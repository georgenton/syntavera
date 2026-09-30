-- Preserve existing contact submissions while aligning the public workflow states.
ALTER TYPE "ContactSubmissionStatus" RENAME TO "ContactSubmissionStatus_old";
CREATE TYPE "ContactSubmissionStatus" AS ENUM ('NEW', 'REVIEWED', 'ARCHIVED');
ALTER TABLE "ContactSubmission" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "ContactSubmission"
  ALTER COLUMN "status" TYPE "ContactSubmissionStatus"
  USING (
    CASE "status"::text
      WHEN 'NEW' THEN 'NEW'
      WHEN 'IN_REVIEW' THEN 'REVIEWED'
      WHEN 'CONTACTED' THEN 'REVIEWED'
      ELSE 'ARCHIVED'
    END
  )::"ContactSubmissionStatus";
ALTER TABLE "ContactSubmission" ALTER COLUMN "status" SET DEFAULT 'NEW';
DROP TYPE "ContactSubmissionStatus_old";

CREATE TYPE "TicketPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'CRITICAL');

ALTER TABLE "Project"
  ADD COLUMN "objective" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "reference" TEXT,
  ADD COLUMN "primaryContactId" UUID;

ALTER TABLE "ProjectPublication"
  ADD COLUMN "changeSummary" TEXT;

ALTER TABLE "Ticket"
  ADD COLUMN "priority" "TicketPriority" NOT NULL DEFAULT 'NORMAL',
  ADD COLUMN "milestoneId" UUID,
  ADD COLUMN "deliverableId" UUID,
  ADD COLUMN "decisionId" UUID;

CREATE INDEX "Project_primaryContactId_idx" ON "Project"("primaryContactId");
CREATE INDEX "Ticket_projectId_priority_idx" ON "Ticket"("projectId", "priority");
CREATE INDEX "Ticket_milestoneId_idx" ON "Ticket"("milestoneId");
CREATE INDEX "Ticket_deliverableId_idx" ON "Ticket"("deliverableId");
CREATE INDEX "Ticket_decisionId_idx" ON "Ticket"("decisionId");

ALTER TABLE "Project"
  ADD CONSTRAINT "Project_primaryContactId_fkey"
  FOREIGN KEY ("primaryContactId") REFERENCES "Contact"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Ticket"
  ADD CONSTRAINT "Ticket_milestoneId_fkey"
  FOREIGN KEY ("milestoneId") REFERENCES "Milestone"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Ticket"
  ADD CONSTRAINT "Ticket_deliverableId_fkey"
  FOREIGN KEY ("deliverableId") REFERENCES "Deliverable"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Ticket"
  ADD CONSTRAINT "Ticket_decisionId_fkey"
  FOREIGN KEY ("decisionId") REFERENCES "Decision"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
