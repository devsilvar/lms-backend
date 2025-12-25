/*
  Warnings:

  - You are about to drop the column `learningOutcomes` on the `Course` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `Review` table without a default value. This is not possible if the table is not empty.
  - Made the column `comment` on table `Review` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."Course" DROP COLUMN "learningOutcomes",
ALTER COLUMN "targetAudience" SET DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "public"."Review" ADD COLUMN     "repliedAt" TIMESTAMP(3),
ADD COLUMN     "repliedBy" TEXT,
ADD COLUMN     "reply" TEXT,
ADD COLUMN     "title" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "comment" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Review_courseId_idx" ON "public"."Review"("courseId");

-- CreateIndex
CREATE INDEX "Review_authorId_idx" ON "public"."Review"("authorId");
