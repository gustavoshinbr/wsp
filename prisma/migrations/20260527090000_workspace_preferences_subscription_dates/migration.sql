ALTER TABLE "Workspace" ADD COLUMN "subscriptionActivatedAt" TIMESTAMP(3);
ALTER TABLE "Workspace" ADD COLUMN "stockViewMode" TEXT NOT NULL DEFAULT 'completo';
