ALTER TABLE "Acceptance"
  ADD COLUMN "organizationId" UUID NOT NULL,
  ADD COLUMN "sessionId" UUID NOT NULL;

CREATE INDEX "Acceptance_organizationId_acceptedAt_idx" ON "Acceptance"("organizationId", "acceptedAt");
CREATE INDEX "Acceptance_sessionId_idx" ON "Acceptance"("sessionId");

ALTER TABLE "Acceptance"
  ADD CONSTRAINT "Acceptance_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
