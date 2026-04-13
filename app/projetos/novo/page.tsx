import { ProjectForm } from "@/components/forms/project/create"
import { Project } from "@prisma/client"
import { getProjectBySlug } from "@/actions/projects"
import { PageContent, PageHeader, PageHeaderDescription, PageHeaderHeading, PageShell } from "@/components/shell"

interface PageProps {
  searchParams: Promise<{ slug?: string }>
}

export default async function NovaPaginaProjeto(props: PageProps) {
  const { slug = null } = await props.searchParams

  let initialProject: Project | null = null
  if (slug) {
    try {
      initialProject = await getProjectBySlug(slug)
    } catch (error) {
      console.error("Failed to fetch project:", error)
    }
  }

  return (
    <PageShell>
      <PageHeader direction="col">
        <PageHeaderHeading>Novo Projeto</PageHeaderHeading>
        <PageHeaderDescription>Preencha os dados para criar um novo projeto.</PageHeaderDescription>
      </PageHeader>

      <PageContent className="rounded-xl text-card-foreground shadow-sm p-6">
        <ProjectForm initialProject={initialProject} embedded />
      </PageContent>
    </PageShell>
  )
}
