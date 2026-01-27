import { Prisma, Project } from "@prisma/client"
import { type WorkPlanFormData } from "@/lib/schemas/work-plan"

// ============================================================================
// VALIDATORS - Using Prisma.validator for type-safe database queries
// ============================================================================

/**
 * Validator for basic WorkPlan query
 */
export const workPlanValidator = Prisma.validator<Prisma.ProjectDefaultArgs>()({
  include: {
    workPlanSchedule: true,
    team: true,
    participants: true,
    responsibilities: true,
  },
})

// ============================================================================
// OUTPUT TYPES - Direct Prisma.validator payloads
// ============================================================================

export type WorkPlanModel = Prisma.ProjectGetPayload<typeof workPlanValidator>

export type GetWorkPlanResponse = Omit<WorkPlanModel, "specificObjectives"> & {
  specificObjectives: string[]
}

/**
 * Response type for upsertWorkPlan
 */
export interface UpsertWorkPlanResponse {
  success: boolean
  data?: Prisma.ProjectGetPayload<typeof workPlanValidator>
  error?: string
}

// ============================================================================
// INPUT TYPES - Function parameters
// ============================================================================

/**
 * Input type for getWorkPlan
 */
export interface GetWorkPlanInput {
  projectId: string
}

/**
 * Input type for upsertWorkPlan
 */
export interface UpsertWorkPlanInput {
  projectId: string
  data: WorkPlanFormData
}
