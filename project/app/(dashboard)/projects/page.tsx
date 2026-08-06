import { ProjectDirectory } from "@/features/projects/components/project-directory"
import { CreateProjectController } from "@/features/projects/controllers/create-project.controller"
import { getAccessibleProjectSummaries } from "@/features/projects/server/project.service"
import { listWorkspaces } from "@/features/workspaces/server/workspace.service"

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ workspace?: string }> }) {
  const [{ workspace }, projects, workspaces] = await Promise.all([
    searchParams,
    getAccessibleProjectSummaries(),
    listWorkspaces(),
  ])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-outer-space-500 dark:text-platinum-500">Projects</h1>
          <p className="mt-2 text-paynes-gray-500 dark:text-french-gray-500">Projects you own or collaborate on.</p>
        </div>
        <CreateProjectController workspaces={workspaces} />
      </div>
      <ProjectDirectory initialWorkspaceId={workspace} projects={projects} workspaces={workspaces} />
    </div>
  )
}
