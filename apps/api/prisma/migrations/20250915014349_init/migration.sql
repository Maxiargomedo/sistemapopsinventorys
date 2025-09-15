-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL,
    "companyName" TEXT,
    "rut" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "logoData" BYTEA,
    "logoType" TEXT,
    "receiptMessage" TEXT,
    "currency" TEXT DEFAULT 'CLP',
    "dateTimeFormat" TEXT DEFAULT 'DD/MM/YYYY HH:mm',
    "taxName" TEXT DEFAULT 'IVA',
    "taxRate" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "documentType" TEXT,
    "defaultPrinter" TEXT,
    "autoCopies" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);
