import { z } from "zod"

export const workPlanSchema = z.object({
  budget: z.string().optional(),
  object: z.string().optional(),
  diagnosis: z.string().optional(),
  planScope: z.string().optional(),
  planJustification: z.string().optional(),
  generalObjective: z.string().min(1, "Objetivo geral é obrigatório"),
  specificObjectives: z.array(
    z.object({
      value: z.string(),
    })
  ),
  methodology: z.string().optional(),
  responsibleUnit: z.string().optional(),
  ictManager: z.string().optional(),
  partnerManager: z.string().optional(),
  monitoring: z.string().optional(),
  expectedResults: z.string().optional(),
  validityStart: z.date().optional().nullable(),
  validityEnd: z.date().optional().nullable(),
})

export type WorkPlanFormData = z.infer<typeof workPlanSchema>
export type WorkPlanFormValues = z.output<typeof workPlanSchema>
