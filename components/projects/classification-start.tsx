"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { FileText, Play, RotateCcw, AlertTriangle, Bot, ShieldCheck, FileCheck, ArrowRight } from "lucide-react"
import { checkExistingLegalInstrument } from "@/actions/legal-instruments"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { ProjectClassificationSavedState } from "@/types/legal-instrument"

interface Props {
  projectSlug: string
  onStart: () => void
  onResume: (savedState: ProjectClassificationSavedState) => void
}

export function ProjectClassificationStart({ projectSlug, onStart, onResume }: Props) {
  const [savedState, setSavedState] = useState<ProjectClassificationSavedState | null>(null)
  const [hasExisting, setHasExisting] = useState(false)
  const [checking, setChecking] = useState(true)
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const check = async () => {
      try {
        const result = await checkExistingLegalInstrument(projectSlug)
        setHasExisting(result.exists)
      } catch (error) {
        console.error("Failed to check existing instrument", error)
      } finally {
        setChecking(false)
      }
    }
    check()
  }, [projectSlug])

  useEffect(() => {
    const urlState = searchParams.get("state")
    const storageKey = `legalInstrumentWizard:${projectSlug}`
    const saved = localStorage.getItem(storageKey)
    if (saved && !urlState) {
      try {
        const parsed: unknown = JSON.parse(saved)
        if (typeof parsed === "object" && parsed !== null && "history" in parsed && Array.isArray((parsed as { history?: unknown }).history)) {
          setSavedState(parsed as ProjectClassificationSavedState)
        }
      } catch (e) {
        console.error("Failed to parse saved state", e)
      }
    }
  }, [searchParams])

  const handleStart = () => {
    // ensure we start from scratch
    const storageKey = `legalInstrumentWizard:${projectSlug}`
    localStorage.removeItem(storageKey)
    const url = new URL(window.location.href)
    url.searchParams.delete("state")
    url.searchParams.set("wizard", projectSlug)
    router.replace(url.pathname + url.search)
    onStart()
  }

  const handleResume = () => {
    if (!savedState) return
    // ensure wizard is namespaced to this project
    const url = new URL(window.location.href)
    url.searchParams.set("wizard", projectSlug)
    router.replace(url.pathname + url.search)
    onResume(savedState)
  }

  return (
    <div className="w-full max-w-3xl mx-auto h-full">
      <div className="text-center mb-10 space-y-4">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-primary/5 text-primary mb-2">
          <FileText className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Classificação do Instrumento Jurídico</h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">Utilize nosso assistente para identificar e gerar o instrumento jurídico correto para o seu projeto.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <div className="flex flex-col items-center text-center p-4 rounded-lg bg-muted/30 border border-border/50">
          <div className="p-2 rounded-full bg-background border mb-3">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <h3 className="font-medium mb-1">Assistente Inteligente</h3>
          <p className="text-sm text-muted-foreground">Responda a perguntas simples para determinar o tipo de parceria.</p>
        </div>
        <div className="flex flex-col items-center text-center p-4 rounded-lg bg-muted/30 border border-border/50">
          <div className="p-2 rounded-full bg-background border mb-3">
            <ShieldCheck className="w-5 h-5 text-primary" />
          </div>
          <h3 className="font-medium mb-1">Conformidade</h3>
          <p className="text-sm text-muted-foreground">Garantia de uso dos modelos aprovados pelo jurídico.</p>
        </div>
        <div className="flex flex-col items-center text-center p-4 rounded-lg bg-muted/30 border border-border/50">
          <div className="p-2 rounded-full bg-background border mb-3">
            <FileCheck className="w-5 h-5 text-primary" />
          </div>
          <h3 className="font-medium mb-1">Geração Automática</h3>
          <p className="text-sm text-muted-foreground">O documento é gerado automaticamente com os dados do projeto.</p>
        </div>
      </div>

      <div className="max-w-md mx-auto space-y-6">
        {hasExisting && (
          <Alert variant="destructive" className="bg-destructive/5 border-destructive/20">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Atenção</AlertTitle>
            <AlertDescription>Este projeto já possui um instrumento jurídico selecionado. Não é possível selecionar um novo.</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col gap-3">
          {savedState ? (
            <>
              <Button size="lg" onClick={handleResume} className="w-full h-12 text-base shadow-sm hover:shadow-md transition-all" disabled={hasExisting || checking}>
                <Play className="mr-2 h-4 w-4" />
                Continuar de onde parou
              </Button>
              <Button variant="ghost" onClick={handleStart} className="w-full text-muted-foreground hover:text-foreground" disabled={hasExisting || checking}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Começar do zero
              </Button>
            </>
          ) : (
            <Button size="lg" onClick={handleStart} className="w-full h-12 text-base shadow-sm hover:shadow-md transition-all" disabled={hasExisting || checking}>
              {checking ? "Carregando..." : hasExisting ? "Reiniciar Classificação" : "Iniciar Assistente"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>

        <p className="text-xs text-center text-muted-foreground">Tempo estimado: 2-3 minutos</p>
      </div>
    </div>
  )
}

export default ProjectClassificationStart
