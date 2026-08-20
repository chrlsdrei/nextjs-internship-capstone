import { Plus } from "lucide-react"
import Link from "next/link"

import { WorkspaceList } from "@/components/workspaces/workspace-list"
import { listWorkspaces } from "@/features/workspaces/queries/list-workspaces"

export default async function WorkspacesPage() {
  const workspaces = await listWorkspaces()

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-bold text-3xl text-outer-space-500 dark:text-platinum-500">Workspaces</h1>
          <p className="mt-2 text-paynes-gray-500 dark:text-french-gray-400">
            Organize projects and collaboration around your teams.
          </p>
        </div>
        {workspaces.length > 0 && (
          <Link
            href="/workspaces/new"
            className="inline-flex items-center gap-2 self-start rounded-lg bg-blue-munsell-500 px-4 py-2 font-medium text-white hover:bg-blue-munsell-600"
          >
            <Plus size={18} /> New workspace
          </Link>
        )}
      </header>
      <WorkspaceList workspaces={workspaces} />
    </div>
  )
}
