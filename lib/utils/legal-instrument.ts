import { LegalInstrumentType } from "@prisma/client"

export const LEGAL_INSTRUMENT_TYPE_LABEL: Record<LegalInstrumentType, string> = {
  [LegalInstrumentType.PDI_AGREEMENT]: "Convênio de PD&I",
  [LegalInstrumentType.SERVICE_CONTRACT]: "Contrato de Serviços Técnicos",
  [LegalInstrumentType.APPDI_PRIVATE]: "APPDI com aporte privado",
  [LegalInstrumentType.APPDI_NO_FUNDING]: "APPDI sem aporte",
  [LegalInstrumentType.COOP_AGREEMENT]: "Acordo / Termo de Cooperação",
  [LegalInstrumentType.NDA]: "NDA / Termo de Confidencialidade",
  [LegalInstrumentType.TECH_TRANSFER]: "Licenciamento / Transferência de Tecnologia",
  [LegalInstrumentType.REVIEW_SCOPE]: "Rever escopo / enquadramento",
}

// Source of truth: indicates whether each legal instrument type requires budget in the work plan.
export const LEGAL_INSTRUMENT_BUDGET_REQUIREMENT: Record<LegalInstrumentType, boolean> = {
  [LegalInstrumentType.PDI_AGREEMENT]: true,
  [LegalInstrumentType.SERVICE_CONTRACT]: true,
  [LegalInstrumentType.APPDI_PRIVATE]: true,
  [LegalInstrumentType.APPDI_NO_FUNDING]: false,
  [LegalInstrumentType.COOP_AGREEMENT]: true,
  [LegalInstrumentType.NDA]: false,
  [LegalInstrumentType.TECH_TRANSFER]: true,
  [LegalInstrumentType.REVIEW_SCOPE]: false,
}

export const LEGAL_INSTRUMENT_TYPES_REQUIRING_BUDGET = Object.entries(LEGAL_INSTRUMENT_BUDGET_REQUIREMENT)
  .filter(([, requiresBudget]) => requiresBudget)
  .map(([type]) => type as LegalInstrumentType)

export function legalInstrumentRequiresBudget(type: LegalInstrumentType | null | undefined): boolean {
  if (!type) return false
  return LEGAL_INSTRUMENT_BUDGET_REQUIREMENT[type] ?? false
}

export function legalInstrumentTypeLabel(type: LegalInstrumentType | null | undefined): string {
  if (!type) return "N/A"
  return LEGAL_INSTRUMENT_TYPE_LABEL[type] ?? String(type)
}
