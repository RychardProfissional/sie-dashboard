"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, Download } from "lucide-react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { notify } from "@/lib/notifications"

interface ExportPdfButtonProps {
  project: any // Using any to avoid strict type issues with missing fields in validator
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
}

export function ExportPdfButton({ project, variant = "outline", size = "sm", className }: ExportPdfButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const generatePDF = async () => {
    try {
      setIsGenerating(true)

      const doc = new jsPDF()

      // Title
      doc.setFontSize(18)
      doc.setTextColor(41, 128, 185)
      doc.text("Relatório Detalhado do Projeto", 14, 20)

      doc.setFontSize(10)
      doc.setTextColor(100)
      doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}`, 14, 26)
      doc.setTextColor(0)

      // 1. PROJECT INFO
      autoTable(doc, {
        startY: 35,
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

      // 5. TECHNICAL SCHEDULE (The "New" for them)
      if (project.schedule) {
        doc.addPage()
        doc.setFontSize(14)
        doc.text("Cronograma de Execução", 14, 20)

        let currentY = 30

        // Milestones
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

        // Independent Tasks
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

      // Save
      doc.save(`projeto-${project.slug}.pdf`)
      notify.success("Relatório PDF completo gerado!")
    } catch (error) {
      console.error("Error generating PDF:", error)
      notify.error("Erro ao gerar PDF detalhado")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Button variant={variant} size={size} className={className} onClick={generatePDF} disabled={isGenerating}>
      {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
      Exportar PDF
    </Button>
  )
}
