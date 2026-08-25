import { ProjectDirectory } from "@/components/projects/project-directory"
import { TechFrameCard } from "@/components/ui/tech-frame-card"
import { WorkspaceEmptyState } from "@/components/workspaces/workspace-empty-state"
import { CreateProjectController } from "@/controllers/projects/create-project.controller"
import { getAccessibleProjectSummaries } from "@/features/projects/queries/get-accessible-project-summaries"
import { getActiveWorkspaceContext } from "@/features/workspaces/queries/get-active-workspace-context"
import { canCreateProjectInWorkspace } from "@/features/workspaces/workspace.policy"

export default async function ProjectsPage() {
  const { activeWorkspace } = await getActiveWorkspaceContext()
  if (!activeWorkspace) return <WorkspaceEmptyState />
  const projects = await getAccessibleProjectSummaries(undefined, activeWorkspace.id)
  const creationWorkspace = canCreateProjectInWorkspace(activeWorkspace) ? activeWorkspace : null

  return (
    <div className="space-y-6">
      <TechFrameCard
        className="min-h-0 w-full"
        contentClassName="min-h-0 gap-0 px-[clamp(2.5rem,5vw,6rem)] py-6 sm:min-h-0 sm:px-[clamp(2.5rem,5vw,6rem)] sm:py-8"
      >
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-bold text-3xl text-white">Projects</h1>
            <p className="mt-2 text-cyan-100/70">Projects in {activeWorkspace.name} that you can access.</p>
          </div>
          <CreateProjectController workspace={creationWorkspace} />
        </header>
      </TechFrameCard>
      <ProjectDirectory projects={projects} workspace={activeWorkspace} />
    </div>
  )
}
