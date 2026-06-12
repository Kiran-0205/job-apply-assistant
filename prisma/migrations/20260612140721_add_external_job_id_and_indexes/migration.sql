-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "externalJobId" TEXT;

-- CreateIndex
CREATE INDEX "Job_userId_createdAt_idx" ON "Job"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Job_userId_sourceUrl_idx" ON "Job"("userId", "sourceUrl");
