import { prisma } from "@/lib/config/db"
import { Prisma } from "@prisma/client"

export type ProjectAction = "CREATED" | "SUBMITTED" | "REVIEW_STARTED" | "APPROVED" | "REJECTED" | "EDITED" | "RETURNED" | "REVIEW_RELEASED" | "RETRACTED" | "PROJECT_CLASSIFIED"

export async function logProjectAction(projectId: string, action: ProjectAction, changedBy: string, changeDetails?: Record<string, unknown>) {
  await prisma.projectAudit.create({
    data: {
      projectId,
      action,
      changedBy,
      changeDetails: changeDetails ? (changeDetails as Prisma.InputJsonValue) : undefined,
    },
  })
}
