-- CreateEnum
CREATE TYPE "FiscalDocumentType" AS ENUM ('NFCE', 'NFE', 'NFSE');

-- CreateEnum
CREATE TYPE "FiscalDocumentStatus" AS ENUM ('PROCESSING', 'AUTHORIZED', 'REJECTED', 'CANCELLED', 'ERROR');

-- AlterTable
ALTER TABLE "Product"
ADD COLUMN "ncm" TEXT,
ADD COLUMN "cfop" TEXT,
ADD COLUMN "csosn" TEXT,
ADD COLUMN "fiscalUnit" TEXT DEFAULT 'UN',
ADD COLUMN "fiscalOrigin" TEXT DEFAULT '0';

-- AlterTable
ALTER TABLE "FiscalConfig"
ADD COLUMN "provider" TEXT NOT NULL DEFAULT 'FOCUS_NFE',
ADD COLUMN "environment" TEXT NOT NULL DEFAULT 'homologacao',
ADD COLUMN "defaultNcm" TEXT,
ADD COLUMN "defaultCfop" TEXT NOT NULL DEFAULT '5102',
ADD COLUMN "defaultCsosn" TEXT NOT NULL DEFAULT '102',
ADD COLUMN "defaultPisCst" TEXT NOT NULL DEFAULT '49',
ADD COLUMN "defaultCofinsCst" TEXT NOT NULL DEFAULT '49',
ADD COLUMN "defaultUnit" TEXT NOT NULL DEFAULT 'UN',
ADD COLUMN "defaultOrigin" TEXT NOT NULL DEFAULT '0';

-- CreateTable
CREATE TABLE "FiscalDocument" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "saleId" TEXT,
    "type" "FiscalDocumentType" NOT NULL,
    "status" "FiscalDocumentStatus" NOT NULL DEFAULT 'PROCESSING',
    "provider" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "number" TEXT,
    "series" TEXT,
    "accessKey" TEXT,
    "protocol" TEXT,
    "statusCode" TEXT,
    "message" TEXT,
    "danfeUrl" TEXT,
    "xmlUrl" TEXT,
    "qrCodeUrl" TEXT,
    "payload" JSONB,
    "response" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FiscalDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FiscalDocument_reference_key" ON "FiscalDocument"("reference");

-- CreateIndex
CREATE INDEX "FiscalDocument_workspaceId_idx" ON "FiscalDocument"("workspaceId");

-- CreateIndex
CREATE INDEX "FiscalDocument_saleId_idx" ON "FiscalDocument"("saleId");

-- CreateIndex
CREATE INDEX "FiscalDocument_status_idx" ON "FiscalDocument"("status");

-- AddForeignKey
ALTER TABLE "FiscalDocument" ADD CONSTRAINT "FiscalDocument_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FiscalDocument" ADD CONSTRAINT "FiscalDocument_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;
