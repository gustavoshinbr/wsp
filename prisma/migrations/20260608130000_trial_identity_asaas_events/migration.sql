CREATE TABLE "TrialIdentity" (
  "id" TEXT NOT NULL,
  "document" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "firstTrialStartedAt" TIMESTAMP(3) NOT NULL,
  "workspaceId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "TrialIdentity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AsaasWebhookEvent" (
  "id" TEXT NOT NULL,
  "event" TEXT NOT NULL,
  "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AsaasWebhookEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TrialIdentity_document_key" ON "TrialIdentity"("document");
CREATE UNIQUE INDEX "TrialIdentity_email_key" ON "TrialIdentity"("email");
CREATE UNIQUE INDEX "TrialIdentity_phone_key" ON "TrialIdentity"("phone");
CREATE INDEX "TrialIdentity_workspaceId_idx" ON "TrialIdentity"("workspaceId");
