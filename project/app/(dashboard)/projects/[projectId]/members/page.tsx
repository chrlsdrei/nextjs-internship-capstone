import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

import { ProjectMemberManagerController } from "@/controllers/projects/members/project-member-manager.controller"
import { getProjectManagementData } from "@/features/members/queries/get-project-management-data"
import { ProjectAccessError } from "@/features/projects/project.error"
import { projectIdSchema } from "@/features/projects/project.schema"

export default async function ProjectMembersPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params
  const parsedProjectId = projectIdSchema.safeParse(projectId)
  if (!parsedProjectId.success) redirect("/projects")

  try {
    const data = await getProjectManagementData(parsedProjectId.data)
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/projects" className="rounded p-2 text-cyan-50 hover:bg-white/10" aria-label="Back to projects">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">Manage {data.project.title}</h1>
            <p className="mt-1 text-cyan-100/75">Project settings and team membership.</p>
          </div>
        </div>
        <ProjectMemberManagerController {...data} />
      </div>
    )
  } catch (error) {
    if (error instanceof ProjectAccessError) redirect("/projects")
    throw error
  }
}
