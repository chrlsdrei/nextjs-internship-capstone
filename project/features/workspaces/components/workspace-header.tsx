import { ArrowLeft, Settings, Users } from "lucide-react"
import Link from "next/link"

import type { WorkspaceDetailDto } from "@/features/workspaces/workspace.types"

import { WorkspaceRoleBadge } from "./workspace-role-badge"

type WorkspaceSection = "overview" | "members" | "settings"

export function WorkspaceHeader({ workspace, current }: { workspace: WorkspaceDetailDto; current: WorkspaceSection }) {
  const linkClass = (section: WorkspaceSection) =>
    `rounded-lg px-3 py-2 text-sm ${
      current === section
        ? "bg-blue-munsell-100 font-medium text-blue-munsell-700 dark:bg-blue-munsell-900 dark:text-blue-munsell-200"
        : "hover:bg-platinum-500 dark:hover:bg-paynes-gray-400"
    }`
  return (
    <header className="space-y-5">
      <div className="flex items-start gap-3">
        <Link
          href="/workspaces"
          aria-label="Back to workspaces"
          className="mt-1 rounded-lg p-2 hover:bg-platinum-500 dark:hover:bg-paynes-gray-400"
        >
          <ArrowLeft size={20} />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-bold text-3xl text-outer-space-500 dark:text-platinum-500">{workspace.name}</h1>
            <WorkspaceRoleBadge role={workspace.role} />
          </div>
          <p className="mt-2 text-paynes-gray-500 dark:text-french-gray-400">
            {workspace.description || "Organize projects and collaboration for this workspace."}
          </p>
        </div>
      </div>
      <nav
        aria-label="Workspace navigation"
        className="flex flex-wrap gap-2 border-french-gray-300 border-b pb-3 dark:border-paynes-gray-400"
      >
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
  )
}
