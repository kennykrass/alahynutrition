-- CreateEnum
CREATE TYPE "PatientDocumentCategory" AS ENUM ('LAB_RESULT', 'INDICATION', 'RECIPE', 'PREVIOUS_PLAN');

-- CreateTable
CREATE TABLE "PatientDocument" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" "PatientDocumentCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "fileData" BYTEA NOT NULL,
    "uploadedByRole" "UserRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatientDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PatientDocument_userId_category_createdAt_idx" ON "PatientDocument"("userId", "category", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "PatientDocument" ADD CONSTRAINT "PatientDocument_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
