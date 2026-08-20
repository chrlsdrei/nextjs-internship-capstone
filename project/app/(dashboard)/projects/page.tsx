import { ProjectDirectory } from "@/components/projects/project-directory"
import { RealisticFogBackground } from "@/components/ui/realistic-fog-background"
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
    <div className="relative isolate -mx-4 -my-8 min-h-[calc(100vh-4rem)] overflow-hidden px-4 py-8 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <RealisticFogBackground />
      <div className="relative z-10 space-y-6">
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
    </div>
  )
}
