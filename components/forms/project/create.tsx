"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState, type MouseEvent } from "react"
import { Project } from "@prisma/client"
import { Check, FileText, Scale, Clock, Lock } from "lucide-react"
import { createProject } from "@/actions/projects"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import TextareaWithCounter from "@/components/ui/textarea-with-counter"
import { notify } from "@/lib/notifications"

const projectFormSchema = z.object({
  titulo: z.string().min(3, "O título deve ter pelo menos 3 caracteres").max(200, "O título deve ter no máximo 200 caracteres"),
  objetivos: z.string().min(10, "Descreva os objetivos com mais detalhes (mínimo 10 caracteres)"),
  justificativa: z.string().min(10, "A justificativa deve ser mais detalhada (mínimo 10 caracteres)"),
  abrangencia: z.string().min(5, "Defina a abrangência (mínimo 5 caracteres)"),
})

type ProjectFormValues = z.infer<typeof projectFormSchema>

type ProjectWithDependencies = Project & {
  workPlan?: unknown | null
  legalInstrumentInstance?: unknown | null
}

interface ProjectFormProps {
  initialProject?: ProjectWithDependencies | null
  embedded?: boolean
}

export function ProjectForm({ initialProject, embedded = false }: ProjectFormProps) {
  const router = useRouter()
  const [step, setStep] = useState<"create" | "choisen" | "loading">(initialProject ? "choisen" : "create")
  const [project, setProject] = useState<ProjectWithDependencies | null>(initialProject || null)

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      titulo: "",
      objetivos: "",
      justificativa: "",
      abrangencia: "",
    },
  })

  const onSubmit = async (data: ProjectFormValues) => {
    setStep("loading")
    try {
      const formData = new FormData()
      formData.append("titulo", data.titulo)
      formData.append("objetivos", data.objetivos)
      formData.append("justificativa", data.justificativa)
      formData.append("abrangencia", data.abrangencia)

      const p = await createProject(formData)

      setProject(p)
      setStep("choisen")
      router.replace(`/projetos/novo?slug=${p.slug}`)
    } catch (error) {
      console.error(error)
      notify.error("Erro ao criar projeto")
      setStep("create")
    }
  }

  if (step === "choisen") {
    const hasWorkPlan = Boolean(project?.workPlan)
    const hasLegalInstrument = Boolean(project?.legalInstrumentInstance)

    const sequentialSteps = [
      {
        id: "legal-instrument",
        title: "1. Inserir Instrumento Jurídico",
        description: "Escolha o instrumento jurídico mais adequado para o seu projeto, considerando as diretrizes e normas aplicáveis.",
        icon: Scale,
        href: `/projetos/${project?.slug}/legal-instrument?next=work-plan`,
        completed: hasLegalInstrument,
        blocked: false,
        blockedMessage: "",
      },
      {
        id: "work-plan",
        title: "2. Inserir Plano de Trabalho",
        description: "Defina a estrutura, mercado e viabilidade do seu projeto.",
        icon: FileText,
        href: `/projetos/${project?.slug}/work-plan`,
        completed: hasWorkPlan,
        blocked: !hasLegalInstrument && !hasWorkPlan,
        blockedMessage: "Conclua o Instrumento Jurídico antes de iniciar o Plano de Trabalho.",
      },
    ]

    const deferredStep = {
      id: "later",
      title: "Continuar depois",
      description: "Voltar para a listagem agora e concluir as etapas pendentes em outro momento.",
      icon: Clock,
      href: `/projetos/${project?.slug}`,
    }

    const handleSequentialStepClick = (event: MouseEvent<HTMLElement>, blocked: boolean, blockedMessage: string) => {
      if (!blocked) return
      event.preventDefault()
      notify.warning(blockedMessage)
    }

    if (embedded) {
      return (
        <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="text-center pb-6">
            <div className="mx-auto bg-green-100 dark:bg-green-900/30 p-3 rounded-full w-fit mb-3 ring-4 ring-green-50 dark:ring-green-900/8">
              <Check className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-2xl font-semibold">Projeto criado com sucesso!</h3>
            <p className="text-sm text-muted-foreground mt-2">
              O projeto <span className="font-medium text-foreground">"{project?.title}"</span> foi iniciado. Como você deseja prosseguir?
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 mt-8">
            {sequentialSteps.map((stepItem) => (
              <Link
                key={stepItem.id}
                href={stepItem.href}
                className="group"
                onClick={(event) => handleSequentialStepClick(event, stepItem.blocked, stepItem.blockedMessage)}
                aria-disabled={stepItem.blocked}
              >
                <div
                  className={`h-full border rounded-xl p-6 hover:shadow-md transition-all duration-300 flex flex-col items-center gap-4 text-center ${stepItem.blocked ? "cursor-not-allowed opacity-70 border-muted bg-muted/30" : "cursor-pointer bg-card hover:border-primary/50"}`}
                >
                  <div className="w-full flex justify-between items-center h-4 -mb-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Etapa</span>
                    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${stepItem.completed ? "text-green-700 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-900/20 dark:border-green-900/30" : stepItem.blocked ? "text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-900/20 dark:border-amber-900/30" : "text-muted-foreground bg-muted border-border"}`}>
                      {stepItem.completed ? "Concluido" : stepItem.blocked ? "Bloqueado" : "Pendente"}
                    </span>
                  </div>
                  <div className={`flex items-center justify-center w-14 h-14 rounded-2xl shrink-0 transition-colors duration-200 ${stepItem.blocked ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground"}`}>
                    <stepItem.icon className="w-7 h-7" />
                  </div>
                  <div className="space-y-2">
                    <h4 className={`font-semibold text-base ${stepItem.blocked ? "text-muted-foreground" : "group-hover:text-primary transition-colors"}`}>
                      {stepItem.title}
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {stepItem.description}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-5 pt-4 border-t border-dashed border-border/80">
            <Link href={deferredStep.href} className="group">
              <div className="border rounded-xl p-4 bg-muted/30 hover:bg-muted/40 transition-colors cursor-pointer">
                <div className="flex items-start gap-3 text-left">
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-muted text-muted-foreground shrink-0">
                    <deferredStep.icon className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{deferredStep.title}</p>
                    <p className="text-xs text-muted-foreground">{deferredStep.description}</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      )
    }

    return (
      <div className="w-full max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Card className="border-none shadow-none bg-transparent">
          <CardHeader className="text-center pb-8">
            <div className="mx-auto bg-green-100 dark:bg-green-900/30 p-4 rounded-full w-fit mb-4 ring-8 ring-green-50 dark:ring-green-900/10">
              <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-3xl font-bold">Projeto criado com sucesso!</CardTitle>
            <CardDescription className="text-lg mt-2">
              O projeto <span className="font-medium text-foreground">"{project?.title}"</span> foi iniciado.
              <br />
              Como você deseja prosseguir?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 w-full">
            <div className="grid gap-6 md:grid-cols-2">
              {sequentialSteps.map((stepItem) => (
              <Link
                key={stepItem.id}
                href={stepItem.href}
                className="group h-full"
                onClick={(event) => handleSequentialStepClick(event, stepItem.blocked, stepItem.blockedMessage)}
                aria-disabled={stepItem.blocked}
              >
                <Card
                  className={`h-full hover:shadow-md transition-all duration-300 ${stepItem.blocked ? "cursor-not-allowed opacity-70 border-muted bg-muted/30" : "cursor-pointer hover:border-primary/50 border-muted"}`}
                >
                  <CardContent className="p-6 flex flex-col items-center gap-4 text-center">
                    <div className="w-full flex justify-between items-center h-4 -mt-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Etapa</span>
                      <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${stepItem.completed ? "text-green-700 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-900/20 dark:border-green-900/30" : stepItem.blocked ? "text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-900/20 dark:border-amber-900/30" : "text-muted-foreground bg-muted border-border"}`}>
                        {stepItem.completed ? "Concluido" : stepItem.blocked ? "Bloqueado" : "Pendente"}
                      </span>
                    </div>
                    <div className={`flex items-center justify-center w-16 h-16 rounded-2xl shrink-0 transition-colors duration-300 ${stepItem.blocked ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground"}`}>
                      <stepItem.icon className="w-8 h-8" />
                    </div>
                    <div className="space-y-2">
                      <h3 className={`font-semibold text-lg transition-colors ${stepItem.blocked ? "text-muted-foreground" : "group-hover:text-primary"}`}>
                        {stepItem.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed px-2">
                        {stepItem.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              ))}
            </div>

            <div className="pt-4 border-t border-dashed border-border/80">
              <Link href={deferredStep.href} className="group block">
                <Card className="border-dashed bg-muted/30 hover:bg-muted/40 transition-colors cursor-pointer">
                  <CardContent className="p-4 flex items-start gap-3 text-left">
                    <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-muted text-muted-foreground shrink-0">
                      <deferredStep.icon className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium">{deferredStep.title}</h4>
                      <p className="text-xs text-muted-foreground">{deferredStep.description}</p>
                    </div>
                    <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                      <Lock className="w-3.5 h-3.5" />
                      Fora da sequencia
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const formInner = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="titulo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título</FormLabel>
              <FormControl>
                <Input placeholder="Ex.: Plataforma de Inovação SIE/UFR" maxLength={200} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="objetivos"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Objetivos</FormLabel>
              <FormControl>
                <TextareaWithCounter placeholder="Descreva os objetivos do projeto..." rows={6} minLength={10} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="justificativa"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Justificativa</FormLabel>
              <FormControl>
                <TextareaWithCounter placeholder="Explique a relevância pública/acadêmica, demanda atendida, etc." rows={6} minLength={10} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="abrangencia"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Abrangência</FormLabel>
              <FormControl>
                <TextareaWithCounter placeholder="Defina localidades, público-alvo e alcance..." rows={5} minLength={5} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" asChild type="button">
            <Link href="/projetos/">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={step === "loading"}>
            {step === "loading" ? "Salvando..." : "Salvar projeto"}
          </Button>
        </div>
      </form>
    </Form>
  )

  if (embedded) return formInner

  return (
    <div className="w-full max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Novo Projeto</CardTitle>
          <CardDescription>Preencha os dados do seu projeto (Plano de Trabalho ficará para depois).</CardDescription>
        </CardHeader>
        <CardContent>{formInner}</CardContent>
      </Card>
    </div>
  )
}
