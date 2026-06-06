-- Replace paid API credentials with the assisted, free Sebrae workflow.
ALTER TYPE "FiscalDocumentStatus" ADD VALUE IF NOT EXISTS 'DRAFT';

ALTER TABLE "Client"
ADD COLUMN "document" TEXT,
ADD COLUMN "email" TEXT;

ALTER TABLE "FiscalDocument"
ADD COLUMN "xmlContent" TEXT;

ALTER TABLE "FiscalConfig"
ALTER COLUMN "provider" SET DEFAULT 'SEBRAE';

UPDATE "FiscalConfig"
SET "provider" = 'SEBRAE';
