import { ArrowLeft, Settings, Users } from "lucide-react"
import Link from "next/link"

import { TechFrameCard } from "@/components/ui/tech-frame-card"
import type { WorkspaceDetailDto } from "@/features/workspaces/workspace.types"

import { WorkspaceRoleBadge } from "./workspace-role-badge"

type WorkspaceSection = "overview" | "members" | "settings"

export function WorkspaceHeader({ workspace, current }: { workspace: WorkspaceDetailDto; current: WorkspaceSection }) {
  const linkClass = (section: WorkspaceSection) =>
    `rounded-lg px-3 py-2 text-sm ${
      current === section
        ? "bg-cyan-300/15 font-medium text-cyan-100 ring-1 ring-cyan-300/35"
        : "text-cyan-100/70 hover:bg-white/10 hover:text-white"
    }`
  return (
    <TechFrameCard
      className="min-h-0 w-full"
      contentClassName="min-h-0 gap-0 px-[clamp(2.5rem,5vw,6rem)] py-6 sm:min-h-0 sm:px-[clamp(2.5rem,5vw,6rem)] sm:py-8"
    >
      <header className="space-y-5">
        <div className="flex items-start gap-3">
          <Link
            href="/workspaces"
            aria-label="Back to workspaces"
            className="mt-1 rounded-lg p-2 text-cyan-50 transition-colors hover:bg-white/10"
          >
            <ArrowLeft size={20} />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-bold text-3xl text-white">{workspace.name}</h1>
              <WorkspaceRoleBadge role={workspace.role} />
            </div>
            <p className="mt-2 text-cyan-100/70">
              {workspace.description || "Organize projects and collaboration for this workspace."}
            </p>
          </div>
        </div>
        <nav aria-label="Workspace navigation" className="flex flex-wrap gap-2 border-cyan-300/20 border-b pb-3">
          <Link
            aria-current={current === "overview" ? "page" : undefined}
            className={linkClass("overview")}
            href={`/workspaces/${workspace.id}`}
          >
            Overview
          </Link>
          <Link
            aria-current={current === "members" ? "page" : undefined}
            className={`inline-flex items-center gap-2 ${linkClass("members")}`}
            href={`/workspaces/${workspace.id}/members`}
          >
            <Users size={16} /> Members
          </Link>
          <Link
            aria-current={current === "settings" ? "page" : undefined}
            className={`inline-flex items-center gap-2 ${linkClass("settings")}`}
            href={`/workspaces/${workspace.id}/settings`}
          >
            <Settings size={16} /> Settings
          </Link>
        </nav>
      </header>
    </TechFrameCard>
  )
}
