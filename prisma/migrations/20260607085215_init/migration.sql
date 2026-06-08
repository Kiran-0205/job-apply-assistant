-- CreateEnum
CREATE TYPE "JobSource" AS ENUM ('MESSAGE', 'URL');

-- CreateEnum
CREATE TYPE "ApplyMethod" AS ENUM ('EMAIL', 'PORTAL', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('SAVED', 'DRAFTED', 'APPLIED', 'INTERVIEW', 'CLOSED');

-- CreateEnum
CREATE TYPE "ReferralStatus" AS ENUM ('NONE', 'TEMPLATE_READY', 'REQUESTED', 'RECEIVED');

-- CreateEnum
CREATE TYPE "ArtifactType" AS ENUM ('EMAIL_DRAFT', 'REFERRAL_REQUEST', 'CONNECTION_NOTE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "source" "JobSource" NOT NULL,
    "rawText" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "company" TEXT,
    "title" TEXT,
    "location" TEXT,
    "jdSummary" TEXT,
    "applyMethod" "ApplyMethod" NOT NULL DEFAULT 'UNKNOWN',
    "contactEmail" TEXT,
    "portalUrl" TEXT,
    "applicationStatus" "ApplicationStatus" NOT NULL DEFAULT 'SAVED',
    "referralStatus" "ReferralStatus" NOT NULL DEFAULT 'NONE',
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneratedArtifact" (
    "id" TEXT NOT NULL,
    "type" "ArtifactType" NOT NULL,
    "content" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GeneratedArtifact_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Job_userId_applicationStatus_idx" ON "Job"("userId", "applicationStatus");

-- CreateIndex
CREATE INDEX "GeneratedArtifact_jobId_type_idx" ON "GeneratedArtifact"("jobId", "type");

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedArtifact" ADD CONSTRAINT "GeneratedArtifact_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
