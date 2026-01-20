"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, Download } from "lucide-react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ProjectStatus, LegalInstrumentType } from "@prisma/client"
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

      // Initialize PDF
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.width

      // Title
      doc.setFontSize(16)
      doc.text("Resumo do Projeto", 14, 20)

      doc.setFontSize(10)
      doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}`, 14, 26)

      // Project Info
      autoTable(doc, {
        startY: 35,
        head: [["Informações do Projeto", ""]],
        body: [
          ["Título", project.title],
          ["Status", project.status],
          ["Proponente", project.user?.name || "-"],
          ["Email", project.user?.email || "-"],
          ["Criado em", format(new Date(project.createdAt), "dd/MM/yyyy", { locale: ptBR })],
        ],
        theme: "grid",
        headStyles: { fillColor: [41, 128, 185] },
      })

      // Objectives & Justification
      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 10,
        head: [["Detalhes", ""]],
        body: [
          ["Objetivos", project.objectives || "Não informado"],
          ["Justificativa", project.justification || "Não informado"],
          ["Abrangência", project.scope || "Não informado"],
        ],
        theme: "grid",
        headStyles: { fillColor: [41, 128, 185] },
        columnStyles: {
          0: { cellWidth: 40, fontStyle: "bold" },
        },
      })

      // Work Plan
      if (project.workPlan) {
        doc.setFontSize(14)
        doc.text("Plano de Trabalho", 14, (doc as any).lastAutoTable.finalY + 15)

        const wp = project.workPlan
        const specificObjectives = Array.isArray(wp.specificObjectives) ? wp.specificObjectives.map((o: any) => (typeof o === "string" ? o : o.value)).join("\n• ") : "-"

        autoTable(doc, {
          startY: (doc as any).lastAutoTable.finalY + 20,
          body: [
            ["Objetivo Geral", wp.generalObjective || "-"],
            ["Objetivos Específicos", specificObjectives ? "• " + specificObjectives : "-"],
            ["Metodologia", wp.methodology || "-"],
            ["Resultados Esperados", wp.expectedResults || "-"],
            ["Diagnóstico", wp.diagnosis || "-"],
            ["Monitoramento", wp.monitoring || "-"],
          ],
          theme: "grid",
          columnStyles: {
            0: { cellWidth: 50, fontStyle: "bold" },
          },
        })

        // Schedule & Team placeholders
        autoTable(doc, {
          startY: (doc as any).lastAutoTable.finalY + 10,
          head: [["Informações Adicionais", ""]],
          body: [
            ["Vigência", `${wp.validityStart ? format(new Date(wp.validityStart), "dd/MM/yyyy") : "?"} até ${wp.validityEnd ? format(new Date(wp.validityEnd), "dd/MM/yyyy") : "?"}`],
            ["Unidade Responsável", wp.responsibleUnit || "-"],
            ["Gestor da ICT", wp.ictManager || "-"],
            ["Gestor do Parceiro", wp.partnerManager || "-"],
          ],
          theme: "grid",
        })
      } else {
        doc.setFontSize(12)
        doc.setTextColor(150)
        doc.text("Plano de Trabalho não iniciado.", 14, (doc as any).lastAutoTable.finalY + 15)
        doc.setTextColor(0)
      }

      // Legal Instrument
      if (project.legalInstrumentInstance) {
        doc.addPage()
        doc.setFontSize(14)
        doc.text("Instrumento Jurídico", 14, 20)

        const li = project.legalInstrumentInstance
        const type = li.legalInstrumentVersion?.legalInstrument?.name || li.legalInstrumentVersion?.type || "-"

        autoTable(doc, {
          startY: 30,
          body: [
            ["Tipo de Instrumento", type],
            ["Status", li.status],
            ["Última Atualização", format(new Date(li.updatedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })],
          ],
          theme: "plain",
        })
      }

      // Save
      doc.save(`projeto-${project.slug}.pdf`)
      notify.success("PDF gerado com sucesso!")
    } catch (error) {
      console.error("Error generating PDF:", error)
      notify.error("Erro ao gerar PDF")
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
