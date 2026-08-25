import { ArrowRight, Users } from "lucide-react"
import Link from "next/link"

import { OrnamentalFrame } from "@/components/ui/ornamental-frame"
import type { WorkspaceSummaryDto } from "@/features/workspaces/workspace.types"

import { WorkspaceRoleBadge } from "./workspace-role-badge"

export function WorkspaceCard({ workspace }: { workspace: WorkspaceSummaryDto }) {
  return (
    <OrnamentalFrame
      className="h-full min-h-[17rem] transition-transform duration-200 hover:-translate-y-0.5"
      contentClassName="h-full px-[clamp(2.75rem,4vw,4rem)] pb-10 pt-8"
    >
      <article className="flex h-full min-h-0 flex-col">
        <div className="flex items-start justify-between gap-4">
          <WorkspaceRoleBadge role={workspace.role} />
          {workspace.status !== "active" && (
            <span className="rounded-full bg-yellow-400/15 px-2.5 py-1 text-xs text-yellow-200 capitalize ring-1 ring-yellow-300/25">
              {workspace.status}
            </span>
          )}
        </div>
        <Link
          href={`/workspaces/${workspace.id}`}
          className="mt-4 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
        >
          <h2 className="font-semibold text-white text-xl">{workspace.name}</h2>
          <p className="mt-2 line-clamp-2 min-h-10 text-cyan-100/70 text-sm">
            {workspace.description || "No description yet."}
          </p>
        </Link>
        <div className="mt-auto flex items-center justify-between gap-4 pt-5 text-cyan-100/70 text-sm">
          <span className="inline-flex items-center gap-2">
            <Users size={16} /> {workspace.memberCount} {workspace.memberCount === 1 ? "member" : "members"}
          </span>
          <Link
            href={`/workspaces/${workspace.id}`}
            className="inline-flex items-center gap-1 font-medium text-cyan-200 hover:text-white"
          >
            Open <ArrowRight size={16} />
          </Link>
        </div>
      </article>
    </OrnamentalFrame>
  )
}
