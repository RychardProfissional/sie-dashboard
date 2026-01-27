/*
  Warnings:

  - You are about to drop the column `workPlanId` on the `Participant` table. All the data in the column will be lost.
  - You are about to drop the column `workPlanId` on the `Responsibility` table. All the data in the column will be lost.
  - You are about to drop the column `workPlanId` on the `ScheduleItem` table. All the data in the column will be lost.
  - You are about to drop the column `workPlanId` on the `TeamMember` table. All the data in the column will be lost.
  - You are about to drop the `WorkPlan` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `projectId` to the `Participant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `projectId` to the `Responsibility` table without a default value. This is not possible if the table is not empty.
  - Added the required column `projectId` to the `ScheduleItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `projectId` to the `TeamMember` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Participant" DROP CONSTRAINT "Participant_workPlanId_fkey";

-- DropForeignKey
ALTER TABLE "Responsibility" DROP CONSTRAINT "Responsibility_workPlanId_fkey";

-- DropForeignKey
ALTER TABLE "ScheduleItem" DROP CONSTRAINT "ScheduleItem_workPlanId_fkey";

-- DropForeignKey
ALTER TABLE "TeamMember" DROP CONSTRAINT "TeamMember_workPlanId_fkey";

-- DropForeignKey
ALTER TABLE "WorkPlan" DROP CONSTRAINT "WorkPlan_projectId_fkey";

-- DropIndex
DROP INDEX "Participant_workPlanId_idx";

-- DropIndex
DROP INDEX "Responsibility_workPlanId_idx";

-- DropIndex
DROP INDEX "ScheduleItem_workPlanId_idx";

-- DropIndex
DROP INDEX "TeamMember_workPlanId_idx";

-- AlterTable
ALTER TABLE "Participant" DROP COLUMN "workPlanId",
ADD COLUMN     "projectId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "diagnosis" TEXT,
ADD COLUMN     "expectedResults" TEXT,
ADD COLUMN     "ictManager" TEXT,
ADD COLUMN     "methodology" TEXT,
ADD COLUMN     "monitoring" TEXT,
ADD COLUMN     "partnerManager" TEXT,
ADD COLUMN     "responsibleUnit" TEXT,
ADD COLUMN     "specificObjectives" JSONB,
ADD COLUMN     "validityEnd" TIMESTAMP(3),
ADD COLUMN     "validityStart" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Responsibility" DROP COLUMN "workPlanId",
ADD COLUMN     "projectId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ScheduleItem" DROP COLUMN "workPlanId",
ADD COLUMN     "projectId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "TeamMember" DROP COLUMN "workPlanId",
ADD COLUMN     "projectId" TEXT NOT NULL;

-- DropTable
DROP TABLE "WorkPlan";

-- CreateIndex
CREATE INDEX "Participant_projectId_idx" ON "Participant"("projectId");

-- CreateIndex
CREATE INDEX "Responsibility_projectId_idx" ON "Responsibility"("projectId");

-- CreateIndex
CREATE INDEX "ScheduleItem_projectId_idx" ON "ScheduleItem"("projectId");

-- CreateIndex
CREATE INDEX "TeamMember_projectId_idx" ON "TeamMember"("projectId");

-- AddForeignKey
ALTER TABLE "ScheduleItem" ADD CONSTRAINT "ScheduleItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Responsibility" ADD CONSTRAINT "Responsibility_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
