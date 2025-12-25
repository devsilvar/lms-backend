/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Enrollment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Enrollment" DROP COLUMN "createdAt",
ADD COLUMN     "enrolledAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "public"."Lesson" ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'ARTICLE';
