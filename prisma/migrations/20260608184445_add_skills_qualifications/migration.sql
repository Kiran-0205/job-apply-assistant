-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "qualifications" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "skills" TEXT[] DEFAULT ARRAY[]::TEXT[];
