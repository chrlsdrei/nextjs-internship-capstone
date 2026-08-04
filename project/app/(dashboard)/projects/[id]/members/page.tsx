import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

import { ProjectMemberManager } from "@/components/project-member-manager"
import { getProjectManagementData } from "@/lib/db/queries/projects"
import { ProjectAccessError } from "@/lib/project-access"
import { projectIdSchema } from "@/lib/validations"

export default async function ProjectMembersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const parsedProjectId = projectIdSchema.safeParse(id)
  if (!parsedProjectId.success) redirect("/projects")

  try {
    const { project, members, role } = await getProjectManagementData(parsedProjectId.data)
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/projects"
            className="rounded p-2 hover:bg-platinum-500 dark:hover:bg-paynes-gray-400"
            aria-label="Back to projects"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-outer-space-500 dark:text-platinum-500">Manage {project.name}</h1>
            <p className="mt-1 text-paynes-gray-500 dark:text-french-gray-500">Project settings and team membership.</p>
          </div>
        </div>
        <ProjectMemberManager project={project} members={members} role={role} />
      </div>
    )
  } catch (error) {
    if (error instanceof ProjectAccessError) redirect("/projects")
    throw error
  }
}
