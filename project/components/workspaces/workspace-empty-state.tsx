import { Building2, Plus } from "lucide-react"
import Link from "next/link"

import { OrnamentalFrame } from "@/components/ui/ornamental-frame"

export function WorkspaceEmptyState({ compact = false }: { compact?: boolean }) {
  return (
    <OrnamentalFrame className="w-full" contentClassName="px-10 py-12 text-center sm:px-16">
      <section>
        <Building2 className="mx-auto text-cyan-300" size={compact ? 32 : 40} />
        <h2 className="mt-4 font-semibold text-white text-xl">Create your first workspace</h2>
        <p className="mx-auto mt-2 max-w-lg text-cyan-100/70 text-sm">
          Workspaces organize your projects and members. Creating one is explicit—new accounts do not receive a hidden
          default workspace.
        </p>
        <Link
          href="/workspaces/new"
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 font-medium text-blue-950 text-sm hover:bg-cyan-300"
        >
          <Plus size={18} /> Create workspace
        </Link>
      </section>
    </OrnamentalFrame>
  )
}
