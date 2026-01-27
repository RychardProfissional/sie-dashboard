import { Card, CardContent } from "@/components/ui/card"
import { Calendar, Users, Briefcase, Clock, Activity, Flag } from "lucide-react"
import { format, differenceInMonths } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ProjectStatusBadge } from "./status-badge"

interface ProjectStatsProps {
  project: any
}

export function ProjectStats({ project }: ProjectStatsProps) {
  const startDate = project.validityStart ? new Date(project.validityStart) : null
  const endDate = project.validityEnd ? new Date(project.validityEnd) : null

  const duration = startDate && endDate ? `${differenceInMonths(endDate, startDate)} meses` : "Não definido"

  const teamCount = project.team?.length || 0
  const objectivesCount = project.specificObjectives?.length || 0

  // Calculate completion based on basic fields
  const fields = [project.methodology, project.expectedResults, project.monitoring, project.diagnosis, project.team?.length > 0, project.validityStart, startDate && endDate]
  const filledFields = fields.filter(Boolean).length
  const progress = Math.round((filledFields / fields.length) * 100)

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardContent className="p-6 flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-2">
            <Calendar className="h-4 w-4" /> Vigência
          </span>
          <div className="flex flex-col">
            <span className="text-2xl font-bold">{duration}</span>
            <span className="text-xs text-muted-foreground truncate" title={startDate ? `${format(startDate, "dd/MM/yyyy")} - ${endDate ? format(endDate, "dd/MM/yyyy") : "?"}` : "Datas não definidas"}>
              {startDate ? format(startDate, "MMM/yy", { locale: ptBR }) : "--"}
              {" - "}
              {endDate ? format(endDate, "MMM/yy", { locale: ptBR }) : "--"}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-2">
            <Users className="h-4 w-4" /> Equipe
          </span>
          <div className="flex flex-col">
            <span className="text-2xl font-bold">{teamCount}</span>
            <span className="text-xs text-muted-foreground">Membros ativos</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-2">
            <Activity className="h-4 w-4" /> Preenchimento
          </span>
          <div className="flex flex-col">
            <span className="text-2xl font-bold">{progress}%</span>
            <span className="text-xs text-muted-foreground">Dados técnicos</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-2">
            <Flag className="h-4 w-4" /> Objetivos
          </span>
          <div className="flex flex-col">
            <span className="text-2xl font-bold">{objectivesCount}</span>
            <span className="text-xs text-muted-foreground">Metas específicas</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
