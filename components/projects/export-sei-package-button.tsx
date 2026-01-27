"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, PackageCheck } from "lucide-react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { notify } from "@/lib/notifications"
import JSZip from "jszip"
import { saveAs } from "file-saver"

interface ExportSeiPackageButtonProps {
  project: any
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
}

export function ExportSeiPackageButton({ project, variant = "secondary", size = "sm", className }: ExportSeiPackageButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const generateReportPDF = () => {
    const doc = new jsPDF()

    // Title
    doc.setFontSize(18)
    doc.setTextColor(41, 128, 185)
    doc.text("Relatório Detalhado do Projeto", 14, 20)

    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}`, 14, 26)
    doc.setTextColor(0)

    // Approval Stamp
    if (project.approvedAt && project.approvalOpinion) {
      doc.setFillColor(236, 240, 241)
      doc.roundedRect(14, 30, 180, 25, 3, 3, "F")
      doc.setFontSize(12)
      doc.setTextColor(39, 174, 96)
      doc.text("PROJETO APROVADO", 20, 40)
      doc.setFontSize(10)
      doc.setTextColor(0)
      doc.text(`Data: ${format(new Date(project.approvedAt), "dd/MM/yyyy", { locale: ptBR })}`, 20, 46)
      doc.setFontSize(9)
      doc.text(`Parecer: ${project.approvalOpinion}`, 20, 51, { maxWidth: 160 })
    }

    const startY = project.approvedAt ? 60 : 35

    // 1. PROJECT INFO
    autoTable(doc, {
      startY: startY,
      head: [["Informações Gerais", ""]],
      body: [
        ["Título", project.title],
        ["Status", project.status],
        ["Proponente", project.user?.name || "-"],
        ["Email", project.user?.email || "-"],
        ["Criado em", format(new Date(project.createdAt), "dd/MM/yyyy", { locale: ptBR })],
      ],
      theme: "grid",
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      columnStyles: { 0: { cellWidth: 40, fontStyle: "bold" } },
    })

    // 2. OBJECTIVES & SCOPE
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [["Escopo e Justificativa", ""]],
      body: [
        ["Objetivos", project.objectives || "Não informado"],
        ["Justificativa", project.justification || "Não informado"],
        ["Abrangência", project.scope || "Não informado"],
      ],
      theme: "grid",
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      columnStyles: { 0: { cellWidth: 40, fontStyle: "bold" } },
    })

    // 3. TEAM MEMBERS
    if (project.team && project.team.length > 0) {
      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 10,
        head: [["Equipe Executora", "Papel/Função"]],
        body: project.team.map((m: any) => [m.name, m.role || "-"]),
        theme: "striped",
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      })
    }

    // 4. WORK PLAN DETAILS
    if (project.methodology) {
      doc.addPage()
      doc.setFontSize(14)
      doc.text("Plano de Trabalho Técnico", 14, 20)

      const objectives = Array.isArray(project.specificObjectives) ? project.specificObjectives.map((o: any) => `- ${typeof o === "string" ? o : o.value}`).join("\n") : "-"

      autoTable(doc, {
        startY: 25,
        body: [
          ["Objetivo Geral", project.objectives || "-"],
          ["Metas Específicas", objectives],
          ["Metodologia", project.methodology || "-"],
          ["Resultados Esperados", project.expectedResults || "-"],
          ["Vigência", `${project.validityStart ? format(new Date(project.validityStart), "dd/MM/yyyy") : "?"} até ${project.validityEnd ? format(new Date(project.validityEnd), "dd/MM/yyyy") : "?"}`],
        ],
        theme: "grid",
        columnStyles: { 0: { cellWidth: 45, fontStyle: "bold" } },
      })
    }

    // 5. TECHNICAL SCHEDULE
    if (project.schedule) {
      doc.addPage()
      doc.setFontSize(14)
      doc.text("Cronograma de Execução", 14, 20)

      let currentY = 30

      if (project.schedule.milestones?.length > 0) {
        project.schedule.milestones.forEach((m: any) => {
          autoTable(doc, {
            startY: currentY,
            head: [[`Marco: ${m.title}`, "Status"]],
            body: [[m.description || "Sem descrição", m.status]],
            theme: "grid",
            headStyles: { fillColor: [52, 73, 94] },
          })

          currentY = (doc as any).lastAutoTable.finalY + 2

          if (m.tasks?.length > 0) {
            autoTable(doc, {
              startY: currentY,
              head: [["Tarefa", "Prazo", "Status"]],
              body: m.tasks.map((t: any) => [t.title, t.dueDate ? format(new Date(t.dueDate), "dd/MM/yyyy") : "-", t.status]),
              theme: "striped",
              margin: { left: 20 },
            })
            currentY = (doc as any).lastAutoTable.finalY + 8
          } else {
            currentY += 10
          }
        })
      }

      if (project.schedule.tasks?.length > 0) {
        autoTable(doc, {
          startY: currentY,
          head: [["Tarefas Avulsas (Fora de Marcos)", "Prazo", "Status"]],
          body: project.schedule.tasks.map((t: any) => [t.title, t.dueDate ? format(new Date(t.dueDate), "dd/MM/yyyy") : "-", t.status]),
          theme: "grid",
          headStyles: { fillColor: [127, 140, 141] },
        })
      }
    }

    // 6. FORMAL SCHEDULE (ScheduleItem)
    if (project.workPlanSchedule && project.workPlanSchedule.length > 0) {
      doc.addPage()
      doc.setFontSize(14)
      doc.text("Metas e Ações Formais", 14, 20)

      autoTable(doc, {
        startY: 30,
        head: [["Eixo/Meta", "Ação/Etapa", "Responsável", "Período"]],
        body: project.workPlanSchedule.map((s: any) => [s.axisGoal, s.actionStep, s.responsible, `${format(new Date(s.startDate), "dd/MM/yy")} - ${format(new Date(s.endDate), "dd/MM/yy")}`]),
        theme: "grid",
        headStyles: { fillColor: [41, 128, 185] },
      })
    }

    return doc.output("arraybuffer")
  }

  const generatePackage = async () => {
    try {
      setIsGenerating(true)
      const zip = new JSZip()

      // 1. Generate Report PDF
      const reportPdfBuffer = generateReportPDF()
      zip.file("1_Relatorio_Tecnico_Aprovado.pdf", reportPdfBuffer)

      // 2. Fetch Legal Instrument PDF if available
      if (project.legalInstrumentInstance?.filledFile?.url) {
        try {
          const response = await fetch(project.legalInstrumentInstance.filledFile.url)
          if (response.ok) {
            const blob = await response.blob()
            const instrumentName = project.legalInstrumentInstance.legalInstrumentVersion?.legalInstrument?.name || "Instrumento_Juridico"
            const safeName = instrumentName.replace(/[^a-z0-9]/gi, "_").toLowerCase()
            zip.file(`2_Minuta_${safeName}.pdf`, blob)
          } else {
            console.warn("Failed to fetch legal instrument file")
            notify.error("Aviso: Não foi possível incluir a minuta jurídica no pacote.")
          }
        } catch (e) {
          console.error("Error fetching legal instrument PDF", e)
          notify.error("Aviso: Falha ao baixar minuta jurídica.")
        }
      }

      // Generate ZIP
      const content = await zip.generateAsync({ type: "blob" })
      saveAs(content, `pacote_sei_projeto_${project.slug}.zip`)
      notify.success("Pacote SEI gerado com sucesso!")
    } catch (error) {
      console.error("Error generating SEI package:", error)
      notify.error("Erro ao gerar pacote SEI")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Button variant={variant} size={size} className={className} onClick={generatePackage} disabled={isGenerating}>
      {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PackageCheck className="mr-2 h-4 w-4" />}
      Baixar Pacote SEI
    </Button>
  )
}
