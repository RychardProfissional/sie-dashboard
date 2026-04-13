"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { LegalInstrumentInstance, ProjectStatus } from "@prisma/client"
import { ArrowLeft, Loader2 } from "lucide-react"
import { notify } from "@/lib/notifications"
import { useProject } from "@/components/providers/project"

import { Button } from "@/components/ui/button"
import { CurrencyInput } from "@/components/ui/currency-input"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

import { saveLegalInstrumentAnswers } from "@/actions/legal-instruments"

import type { LegalInstrumentAnswers, LegalInstrumentFieldSpec, LegalInstrumentAnswerValue } from "@/types/legal-instrument"

type FieldSpec = LegalInstrumentFieldSpec

interface LegalInstrumentFillClientProps {
  instance: LegalInstrumentInstance & {
    project: {
      status: ProjectStatus
    }
    legalInstrumentVersion: {
      fieldsJson: unknown
      templateFile: { url: string; key: string } | null
      legalInstrument: { name: string; description: string }
      type: string
    }
    filledFile?: { url: string; key: string } | null
  }
  projectSlug: string
}

export default function LegalInstrumentFillClient({ instance, projectSlug }: LegalInstrumentFillClientProps) {
  const router = useRouter()
  const { updateLegalInstrument } = useProject()
  const [answers, setAnswers] = useState<LegalInstrumentAnswers>((instance.answers as unknown as LegalInstrumentAnswers) || {})
  const [saving, setSaving] = useState(false)
  const [saveIndicator, setSaveIndicator] = useState<"saved" | "pending" | "saving" | "error">("saved")
  const [localStatus, setLocalStatus] = useState(instance.status)

  const fields = (instance.legalInstrumentVersion.fieldsJson as unknown as FieldSpec[]) || []
  const isLocked = instance.project?.status === ProjectStatus.UNDER_REVIEW || instance.project?.status === ProjectStatus.APPROVED
  const isEditable = !isLocked

  const debounceMs = 900
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isSavingRef = useRef(false)
  const dirtyRef = useRef(false)
  const latestAnswersRef = useRef<LegalInstrumentAnswers>(answers)
  const lastSavedHashRef = useRef<string>(JSON.stringify((instance.answers as unknown as LegalInstrumentAnswers) || {}))

  useEffect(() => {
    latestAnswersRef.current = answers
  }, [answers])

  const autosaveUrl = useMemo(() => `/api/legal-instruments/instances/${instance.id}/autosave`, [instance.id])

  const flushSave = async (opts?: { silent?: boolean }) => {
    if (!isEditable) return
    if (!dirtyRef.current) return
    if (isSavingRef.current) return

    isSavingRef.current = true
    setSaveIndicator("saving")

    try {
      const updated = await saveLegalInstrumentAnswers(instance.id, latestAnswersRef.current)
      lastSavedHashRef.current = JSON.stringify((updated.answers as unknown as LegalInstrumentAnswers) || {})
      dirtyRef.current = false
      setLocalStatus(updated.status)
      setSaveIndicator("saved")

      // Update global project context
      if (updateLegalInstrument) {
        updateLegalInstrument(updated as any)
      }

      if (!opts?.silent) {
        // keep the UI quiet; no toast needed on autosave
      }
    } catch (error) {
      console.error(error)
      setSaveIndicator("error")
      if (!opts?.silent) {
        notify.error("Falha ao salvar automaticamente")
      }
    } finally {
      isSavingRef.current = false
    }
  }

  // Debounced autosave on change
  useEffect(() => {
    if (!isEditable) return

    const currentHash = JSON.stringify(answers)
    if (currentHash === lastSavedHashRef.current) {
      dirtyRef.current = false
      if (saveIndicator !== "saving") setSaveIndicator("saved")
      return
    }

    dirtyRef.current = true
    if (saveIndicator !== "saving") setSaveIndicator("pending")

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      void flushSave({ silent: true })
    }, debounceMs)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, isEditable])

  // Best-effort flush when leaving the page
  useEffect(() => {
    if (!isEditable) return

    const keepalive = () => {
      if (!dirtyRef.current) return
      try {
        const payload = JSON.stringify({ answers: latestAnswersRef.current })
        void fetch(autosaveUrl, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: payload,
          keepalive: true,
          credentials: "include",
        })
      } catch {
        // ignore
      }
    }

    const onPageHide = () => keepalive()
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") keepalive()
    }

    window.addEventListener("pagehide", onPageHide)
    window.addEventListener("beforeunload", onPageHide)
    document.addEventListener("visibilitychange", onVisibilityChange)

    return () => {
      window.removeEventListener("pagehide", onPageHide)
      window.removeEventListener("beforeunload", onPageHide)
      document.removeEventListener("visibilitychange", onVisibilityChange)

      // For in-app navigation/unmount, server action often still completes.
      void flushSave({ silent: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autosaveUrl, isEditable])

  const handleChange = (id: string, value: LegalInstrumentAnswerValue) => {
    if (!isEditable) return
    setAnswers((prev) => ({ ...prev, [id]: value }))
  }

  const handleGoToProject = async () => {
    setSaving(true)
    try {
      await flushSave({ silent: true })
      router.push(`/projetos/${projectSlug}`)
      router.refresh()
    } catch (error) {
      console.error(error)
      notify.error("Não foi possível salvar antes de sair.")
      router.push(`/projetos/${projectSlug}`)
    } finally {
      setSaving(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="secondary">Pendente</Badge>
      case "PARTIAL":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Parcial</Badge>
      case "FILLED":
        return <Badge className="bg-green-500 hover:bg-green-600">Preenchido</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Preenchimento do Instrumento Jurídico</h1>
            {getStatusBadge(localStatus)}
            <span className="text-xs text-muted-foreground">
              {saveIndicator === "saving" && "Salvando..."}
              {saveIndicator === "pending" && "Alterações pendentes"}
              {saveIndicator === "saved" && "Salvo"}
              {saveIndicator === "error" && "Falha ao salvar"}
            </span>
          </div>
          <p className="text-muted-foreground">Preencha os campos abaixo para gerar o documento.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados do Instrumento</CardTitle>
          <CardDescription>Campos definidos para este tipo de instrumento.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {fields.length === 0 && <div className="text-center py-8 text-muted-foreground">Nenhum campo configurado para este instrumento.</div>}

          {fields.map((field) => (
            <div key={field.id} className="space-y-2">
              <Label htmlFor={field.id}>
                {field.label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </Label>

              {field.type === "textarea" ? (
                <Textarea id={field.id} value={answers[field.id] || ""} onChange={(e) => handleChange(field.id, e.target.value)} placeholder={`Digite ${field.label.toLowerCase()}...`} className="min-h-[100px]" disabled={!isEditable} />
              ) : field.type === "date" ? (
                <Input id={field.id} type="date" value={answers[field.id] || ""} onChange={(e) => handleChange(field.id, e.target.value)} disabled={!isEditable} />
              ) : field.type === "currency" ? (
                <CurrencyInput id={field.id} value={String(answers[field.id] || "")} onValueChange={(value) => handleChange(field.id, value)} placeholder="R$ 0,00" disabled={!isEditable} />
              ) : field.type === "number" ? (
                <Input id={field.id} type="number" step="1" value={answers[field.id] || ""} onChange={(e) => handleChange(field.id, e.target.value)} disabled={!isEditable} />
              ) : (
                <Input id={field.id} type={field.type === "email" ? "email" : "text"} value={answers[field.id] || ""} onChange={(e) => handleChange(field.id, e.target.value)} placeholder={`Digite ${field.label.toLowerCase()}...`} disabled={!isEditable} />
              )}
            </div>
          ))}

          <Separator className="my-6" />

          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => router.back()}>
              Voltar
            </Button>
            {isEditable && (
              <Button onClick={handleGoToProject} disabled={saving} variant="default">
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Indo para o projeto...
                  </>
                ) : (
                  <>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar para o projeto
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
