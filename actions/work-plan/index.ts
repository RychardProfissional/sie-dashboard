"use server"

import { prisma } from "@/lib/config/db"
import { type WorkPlanFormData } from "@/lib/schemas/work-plan"
import { ProjectStatus } from "@prisma/client"
import { workPlanValidator, GetWorkPlanResponse, UpsertWorkPlanResponse } from "./types"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/config/auth"
import { logProjectAction } from "@/lib/services/audit"

export async function getWorkPlan(projectId: string): Promise<GetWorkPlanResponse | null> {
  try {
    const workPlan = await prisma.project.findUnique({
      where: { id: projectId },
      ...workPlanValidator,
    })

    if (!workPlan) return null

    // Parse specificObjectives robustly into string[]
    let specificObjectives: string[] = []
    if (workPlan.specificObjectives && Array.isArray(workPlan.specificObjectives)) {
      specificObjectives = workPlan.specificObjectives
        .map((item) => {
          if (typeof item === "string") return item
          if (typeof item === "object" && item !== null && "value" in item) {
            const maybeValue = (item as { value?: unknown }).value
            return typeof maybeValue === "string" ? maybeValue : undefined
          }
          return undefined
        })
        .filter((v): v is string => typeof v === "string" && v.length > 0)
    }

    return {
      ...workPlan,
      object: workPlan.title,
      generalObjective: workPlan.objectives,
      planScope: workPlan.scope,
      planJustification: workPlan.justification,
      specificObjectives,
    } as any
  } catch (error) {
    console.error("Error fetching work plan:", error)
    throw new Error("Failed to fetch work plan")
  }
}

export async function upsertWorkPlan(projectId: string, data: WorkPlanFormData): Promise<UpsertWorkPlanResponse> {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { status: true },
    })

    if (!project) {
      return { success: false, error: "Project not found" }
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    if (project.status !== ProjectStatus.DRAFT && project.status !== ProjectStatus.RETURNED) {
      return { success: false, error: "Project is locked for editing" }
    }

    const { object, generalObjective, planScope, planJustification, ...rest } = data

    const workPlan = await prisma.project.update({
      where: { id: projectId },
      data: {
        ...rest,
        title: object || undefined,
        objectives: generalObjective,
        scope: planScope,
        justification: planJustification,
        specificObjectives: data.specificObjectives as any,
      },
      ...workPlanValidator,
    })

    // Log audit
    try {
      await logProjectAction(projectId, "EDITED", session.user.id, {
        section: "TECHNICAL_PLAN",
      })
    } catch (e) {
      console.error("log upsertWorkPlan error", e)
    }

    revalidatePath(`/projetos/${projectId}`)
    revalidatePath("/projetos", "page")
    revalidatePath(`/admin/projetos`, "page")

    return { success: true, data: workPlan as any }
  } catch (error) {
    console.error("Error upserting work plan:", error)
    return { success: false, error: "Failed to save work plan" }
  }
}
