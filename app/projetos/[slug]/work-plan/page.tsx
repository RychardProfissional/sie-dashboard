"use client"

import { useEffect, useState } from "react"
import { useProject } from "@/components/providers/project"
import { Skeleton } from "@/components/ui/skeleton"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { workPlanSchema, type WorkPlanFormData } from "@/lib/schemas/work-plan"
import { getWorkPlan, upsertWorkPlan } from "@/actions/work-plan"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { CurrencyInput } from "@/components/ui/currency-input"
import { Textarea } from "@/components/ui/textarea"
import { notify } from "@/lib/notifications"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import LoadingOverlay from "@/components/ui/loading-overlay"
import { useRouter, useSearchParams } from "next/navigation"
import { PageContent, PageHeader, PageHeaderDescription, PageHeaderHeading, PageShell } from "@/components/shell"
import { legalInstrumentRequiresBudget } from "@/lib/utils/legal-instrument"

export default function Page() {
  const searchParams = useSearchParams()
  const route = useRouter()
  const { project, loading: projectLoading, refetch, updateWorkPlan } = useProject()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const form = useForm<WorkPlanFormData>({
    resolver: zodResolver(workPlanSchema),
    defaultValues: {
      budget: "",
      object: "",
      diagnosis: "",
      planScope: "",
      planJustification: "",
      generalObjective: "",
      specificObjectives: [],
      methodology: "",
      responsibleUnit: "",
      ictManager: "",
      partnerManager: "",
      monitoring: "",
      expectedResults: "",
    },
  })

  const { fields, append, remove } = useFieldArray<WorkPlanFormData, "specificObjectives">({
    control: form.control,
    name: "specificObjectives" as const,
  })

  async function onSubmit(data: WorkPlanFormData) {
    if (!project?.id) return

    const legalInstrumentType = project.legalInstrumentInstance?.legalInstrumentVersion?.type
    const requiresBudget = legalInstrumentRequiresBudget(legalInstrumentType)
    if (requiresBudget && !data.budget?.trim()) {
      form.setError("budget", { type: "manual", message: "Orçamento é obrigatório para este instrumento jurídico." })
      notify.error("Preencha o orçamento para continuar")
      return
    }

    setSaving(true)
    try {
      const result = await upsertWorkPlan(project.id, data)
      if (result.success) {
        notify.success("Plano de trabalho salvo com sucesso!")
        // Update locally to avoid a heavy refetch and improve responsiveness
        if (updateWorkPlan) {
          updateWorkPlan(result.data || null)
        } else {
          await refetch()
        }
        const next = searchParams.get("next")
        if (next) {
          route.push(`/projetos/${project.slug}/${next}`)
          return
        }

        route.push(`/projetos/${project.slug}/`)
      } else {
        notify.error(result.error || "Erro ao salvar")
      }
    } catch (error) {
      notify.error("Erro inesperado ao salvar")
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    async function loadData() {
      if (project?.id) {
        try {
          const data = await getWorkPlan(project.id)
          if (data) {
            form.reset({
              budget: data.budget || "",
              object: data.object || "",
              diagnosis: data.diagnosis || "",
              planScope: data.planScope || "",
              planJustification: data.planJustification || "",
              generalObjective: data.generalObjective || "",
              specificObjectives: data.specificObjectives.map(so => ({value: so})) || [],
              methodology: data.methodology || "",
              responsibleUnit: data.responsibleUnit || "",
              ictManager: data.ictManager || "",
              partnerManager: data.partnerManager || "",
              monitoring: data.monitoring || "",
              expectedResults: data.expectedResults || "",
              validityStart: data.validityStart ? new Date(data.validityStart) : null,
              validityEnd: data.validityEnd ? new Date(data.validityEnd) : null,
            })
          }
        } catch (error) {
          notify.error("Erro ao carregar plano de trabalho")
        } finally {
          setLoading(false)
        }
      } else if (!projectLoading) {
        setLoading(false)
      }
    }

    loadData()
  }, [project?.id, projectLoading, form])

  useEffect(() => {
    if (projectLoading || loading || !project?.slug) return
    if (!project.legalInstrumentInstance) {
      notify.warning("Conclua o Instrumento Jurídico antes de iniciar o Plano de Trabalho.")
      route.replace(`/projetos/${project.slug}/legal-instrument?next=work-plan`)
    }
  }, [projectLoading, loading, project, route])

  if (projectLoading || loading) {
    return (
      <div className="max-w-5xl w-full mx-auto py-8 space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-[300px]" />
          <Skeleton className="h-4 w-[500px]" />
        </div>

        <div className="space-y-8">
          {/* Informações Gerais */}
          <div className="text-card-foreground">
            <div className="flex flex-col space-y-1.5 p-6">
              <Skeleton className="h-6 w-[200px]" />
            </div>
            <div className="p-6 pt-0 space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-[100px] w-full" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[150px]" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[150px]" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            </div>
          </div>

          {/* Diagnóstico */}
          <div className="text-card-foreground">
            <div className="flex flex-col space-y-1.5 p-6">
              <Skeleton className="h-6 w-[250px]" />
            </div>
            <div className="p-6 pt-0 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-[120px]" />
                  <Skeleton className="h-[100px] w-full" />
                </div>
              ))}
            </div>
          </div>

          {/* Objetivos */}
          <div className="text-card-foreground">
            <div className="flex flex-col space-y-1.5 p-6">
              <Skeleton className="h-6 w-[150px]" />
            </div>
            <div className="p-6 pt-0 space-y-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-[120px]" />
                <Skeleton className="h-20 w-full" />
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-[150px]" />
                  <Skeleton className="h-9 w-[100px]" />
                </div>
                {[1, 2].map((i) => (
                  <div key={i} className="flex gap-2">
                    <Skeleton className="h-10 flex-1" />
                    <Skeleton className="h-10 w-10" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!project) return null
  if (!project.legalInstrumentInstance) return null

  const legalInstrumentType = project.legalInstrumentInstance.legalInstrumentVersion?.type
  const requiresBudget = legalInstrumentRequiresBudget(legalInstrumentType)

  return (
    <PageShell>
      <LoadingOverlay open={saving} message="Salvando plano de trabalho..." />
      <PageHeader direction="col">
        <PageHeaderHeading>Plano de Trabalho</PageHeaderHeading>
        <PageHeaderDescription>Defina os detalhes, objetivos e metodologia do projeto.</PageHeaderDescription>
      </PageHeader>

      <PageContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card className="border-0 bg-transparent shadow-none">
              <CardHeader className="px-0 pb-4">
              <CardTitle>Informações Gerais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 px-0">
              <FormField
                control={form.control}
                name="budget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Orçamento {requiresBudget ? <span className="text-destructive">*</span> : null}
                    </FormLabel>
                    <FormControl>
                      <CurrencyInput placeholder="Ex.: R$ 150.000,00" value={field.value || ""} onValueChange={field.onChange} name={field.name} onBlur={field.onBlur} ref={field.ref} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="object"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Objeto</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Descreva o objeto do plano..." className="min-h-[100px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="validityStart"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Início da Vigência</FormLabel>
                      <FormControl>
                        <Input type="date" value={field.value ? new Date(field.value).toISOString().split("T")[0] : ""} onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="validityEnd"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fim da Vigência</FormLabel>
                      <FormControl>
                        <Input type="date" value={field.value ? new Date(field.value).toISOString().split("T")[0] : ""} onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-transparent shadow-none">
              <CardHeader className="px-0 pb-4">
              <CardTitle>Diagnóstico e Justificativa</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 px-0">
              <FormField
                control={form.control}
                name="diagnosis"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Diagnóstico</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Diagnóstico da situação atual..." className="min-h-[100px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="planJustification"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Justificativa</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Justificativa para o plano..." className="min-h-[100px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="planScope"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Abrangência</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Abrangência do plano..." className="min-h-[100px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              </CardContent>
            </Card>

            <Card className="border-0 bg-transparent shadow-none">
              <CardHeader className="px-0 pb-4">
              <CardTitle>Objetivos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 px-0">
              <FormField
                control={form.control}
                name="generalObjective"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Objetivo Geral</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Objetivo geral do projeto..." className="min-h-20" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <FormLabel>Objetivos Específicos</FormLabel>
                  <Button type="button" variant="outline" size="sm" onClick={() => append({value: ''})}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </div>
                {fields.map((field, index) => (
                  <div key={field.id} className="flex gap-2">
                    <FormField
                      control={form.control}
                      name={`specificObjectives.${index}.value`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input {...field} placeholder={`Objetivo específico ${index + 1}`} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                {fields.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhum objetivo específico adicionado.</p>}
              </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-transparent shadow-none">
              <CardHeader className="px-0 pb-4">
              <CardTitle>Metodologia e Resultados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 px-0">
              <FormField
                control={form.control}
                name="methodology"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Metodologia</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Metodologia a ser aplicada..." className="min-h-[150px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="expectedResults"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resultados Esperados</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Resultados esperados..." className="min-h-[100px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="monitoring"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monitoramento e Avaliação</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Como será feito o monitoramento..." className="min-h-[100px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              </CardContent>
            </Card>

            <Card className="border-0 bg-transparent shadow-none">
              <CardHeader className="px-0 pb-4">
              <CardTitle>Responsáveis</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 px-0">
              <FormField
                control={form.control}
                name="responsibleUnit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidade Responsável</FormLabel>
                    <FormControl>
                      <Input placeholder="Unidade responsável..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ictManager"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gestor da ICT</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do gestor da ICT..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="partnerManager"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gestor do Parceiro</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do gestor do parceiro..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button type="submit" disabled={saving} size="lg">
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Plano de Trabalho
              </Button>
            </div>
          </form>
        </Form>
      </PageContent>
    </PageShell>
  )
}
