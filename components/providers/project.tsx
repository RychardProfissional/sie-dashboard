"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { useParams, useRouter } from "next/navigation"
import axios from "axios"
import { getProjectBySlug, getProjectViewerContext } from "@/actions/projects"
import type { GetProjectBySlugResponse, ProjectViewerContext } from "@/actions/projects/types"

type ProjectData = NonNullable<GetProjectBySlugResponse>

export type ProjectDependences = {
  "legal-instrument": ProjectData["legalInstrumentInstance"] | null
}

interface ProjectContextType {
  project: GetProjectBySlugResponse
  loading: boolean
  dependences: ProjectDependences
  view: ProjectViewerContext | null
  refetch: (showLoading?: boolean) => Promise<void>
  updateWorkPlan: (project: ProjectData | null) => void
  updateLegalInstrument: (instance: ProjectData["legalInstrumentInstance"] | null) => void
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined)

export function ProjectProvider({ children }: { children: ReactNode }) {
  const params: { slug: string } = useParams()
  const router = useRouter()
  const [project, setProject] = useState<GetProjectBySlugResponse>(null)
  const [loading, setLoading] = useState(true)
  const [dependences, setDependences] = useState<ProjectDependences>({
    "legal-instrument": null,
  })
  const [view, setView] = useState<ProjectViewerContext | null>(null)

  const fetchProject = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true)
      const [data, viewer] = await Promise.all([getProjectBySlug(params.slug), getProjectViewerContext(params.slug)])
      if (!data) {
        router.push("/404")
        return
      }

      setProject(data)
      setView(viewer)
      setDependences({
        "legal-instrument": data?.legalInstrumentInstance || null,
      })
    } catch (error: unknown) {
      console.error("Failed to fetch project:", error)
      if (axios.isAxiosError(error) && error.response?.status === 404) router.push("/404")
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  useEffect(() => {
    if (params.slug) {
      fetchProject()
    }
  }, [params.slug, router])

  const updateWorkPlan = (newProject: ProjectData | null) => {
    setProject(newProject)
  }

  const updateLegalInstrument = (instance: ProjectData["legalInstrumentInstance"] | null) => {
    setDependences((prev) => ({ ...prev, "legal-instrument": instance }))
    setProject((prev) => {
      if (!prev) return prev
      return { ...prev, legalInstrumentInstance: instance }
    })
  }

  return <ProjectContext.Provider value={{ project, dependences, loading, view, refetch: fetchProject, updateWorkPlan, updateLegalInstrument }}>{children}</ProjectContext.Provider>
}

export function useProject() {
  const context = useContext(ProjectContext)
  if (context === undefined) {
    throw new Error("useProject must be used within a ProjectProvider")
  }
  return context
}
