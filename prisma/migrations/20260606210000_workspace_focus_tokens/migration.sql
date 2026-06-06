-- Store each workshop's Focus NFe credentials encrypted at the application layer.
ALTER TABLE "FiscalConfig"
ADD COLUMN "focusHomologationTokenEncrypted" TEXT,
ADD COLUMN "focusHomologationTokenLastFour" TEXT,
ADD COLUMN "focusProductionTokenEncrypted" TEXT,
ADD COLUMN "focusProductionTokenLastFour" TEXT;
