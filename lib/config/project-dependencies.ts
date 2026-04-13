import { LegalInstrumentStatus } from "@prisma/client"

type DepSpec = {
  id: string
  order: number
  label: string
  description: string
  route: (slug: string) => string
  actionLabel: string
  isSequential?: boolean
  isRequired?: (dependences: any, project: any) => boolean
  isCompleted: (dependences: any, project: any) => boolean
}

export const DEPENDENCY_SPECS: DepSpec[] = [
  {
    id: "legal-instrument-select",
    order: 1,
    label: "Instrumento Jurídico",
    description: "Instrumento jurídico ainda não foi selecionado para este projeto.",
    route: (s) => `/projetos/${s}/legal-instrument`,
    actionLabel: "Selecionar",
    isSequential: true,
    isRequired: () => true,
    isCompleted: (dependences) => !!dependences?.["legal-instrument"],
  },
  {
    id: "legal-instrument-fill",
    order: 2,
    label: "Preencher Instrumento Jurídico",
    description: "O instrumento jurídico precisa ser preenchido para gerar o documento.",
    route: (s) => `/projetos/${s}/legal-instrument/fill`,
    actionLabel: "Preencher",
    isSequential: true,
    isRequired: () => true,
    isCompleted: (dependences) => {
      const li = dependences?.["legal-instrument"]
      if (!li) return false
      const status = li.status || LegalInstrumentStatus.PENDING
      return status === LegalInstrumentStatus.FILLED
    },
  },
  {
    id: "work-plan",
    order: 3,
    label: "Plano de Trabalho",
    description: "O plano de trabalho ainda não foi criado. É necessário definir metas e cronograma.",
    route: (s) => `/projetos/${s}/work-plan`,
    actionLabel: "Criar Plano",
    isSequential: true,
    isRequired: () => true,
    isCompleted: (dependences) => !!dependences?.["work-plan"],
  },
]

type ComputeOptions = {
  mode?: "single-next" | "all"
}

export function computeMissingDependencies(project: any, dependences: any, slug: string, options: ComputeOptions = {}) {
  const mode = options.mode ?? "single-next"
  const ordered = [...DEPENDENCY_SPECS]
    .sort((a, b) => a.order - b.order)
    .filter((spec) => (spec.isRequired ? spec.isRequired(dependences, project) : true))

  const missing = ordered
    .filter((spec) => !spec.isCompleted(dependences, project))
    .map((spec) => ({ id: spec.id, label: spec.label, description: spec.description, link: spec.route(slug), action: spec.actionLabel, blocked: false }))

  for (let i = 0; i < missing.length; i++) {
    const spec = ordered.find((s) => s.id === missing[i].id)
    if (!spec) continue
    const earlier = ordered.filter((s) => s.order < spec.order && s.isSequential !== false)
    const blocked = earlier.some((e) => !e.isCompleted(dependences, project))
    ;(missing[i] as any).blocked = blocked
  }

  if (mode === "single-next") {
    const next = missing.find((item) => !(item as any).blocked)
    return next ? [next] : []
  }

  return missing
}

export default DEPENDENCY_SPECS
