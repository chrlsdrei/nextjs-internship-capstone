import { ProjectDirectory } from "@/components/projects/project-directory"
import { TechFrameCard } from "@/components/ui/tech-frame-card"
import { CreateProjectController } from "@/controllers/projects/create-project.controller"
import { getAccessibleProjectSummaries } from "@/features/projects/queries/get-accessible-project-summaries"
import { listWorkspaces } from "@/features/workspaces/queries/list-workspaces"
import { canCreateProjectInWorkspace } from "@/features/workspaces/workspace.policy"

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ workspace?: string }> }) {
  const [{ workspace }, projects, workspaces] = await Promise.all([
    searchParams,
    getAccessibleProjectSummaries(),
    listWorkspaces(),
  ])

  return (
    <div className="space-y-6">
      <TechFrameCard
        className="min-h-0 w-full"
        contentClassName="min-h-0 gap-0 px-[clamp(2.5rem,5vw,6rem)] py-6 sm:min-h-0 sm:px-[clamp(2.5rem,5vw,6rem)] sm:py-8"
      >
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-bold text-3xl text-white">Projects</h1>
            <p className="mt-2 text-cyan-100/70">Projects you own or collaborate on.</p>
          </div>
          <CreateProjectController workspaces={workspaces.filter(canCreateProjectInWorkspace)} />
        </header>
      </TechFrameCard>
      <ProjectDirectory initialWorkspaceId={workspace} projects={projects} workspaces={workspaces} />
    </div>
  )
}
