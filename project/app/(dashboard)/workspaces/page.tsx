import { Plus } from "lucide-react"
import Link from "next/link"

import { TechFrameCard } from "@/components/ui/tech-frame-card"
import { WorkspaceList } from "@/components/workspaces/workspace-list"
import { listWorkspaces } from "@/features/workspaces/queries/list-workspaces"

export default async function WorkspacesPage() {
  const workspaces = await listWorkspaces()

  return (
    <div className="space-y-6">
      <TechFrameCard
        className="min-h-0 w-full"
        contentClassName="min-h-0 gap-0 px-[clamp(2.5rem,5vw,6rem)] py-6 sm:min-h-0 sm:px-[clamp(2.5rem,5vw,6rem)] sm:py-8"
      >
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-bold text-3xl text-white">Workspaces</h1>
            <p className="mt-2 text-cyan-100/70">Organize projects and collaboration around your teams.</p>
          </div>
          {workspaces.length > 0 && (
            <Link
              href="/workspaces/new"
              className="inline-flex items-center gap-2 self-start rounded-lg bg-cyan-500 px-4 py-2 font-medium text-blue-950 shadow-[0_0_14px_rgba(34,211,238,0.28)] transition-colors hover:bg-cyan-300"
            >
              <Plus size={18} /> New workspace
            </Link>
          )}
        </header>
      </TechFrameCard>
      <WorkspaceList workspaces={workspaces} />
    </div>
  )
}
