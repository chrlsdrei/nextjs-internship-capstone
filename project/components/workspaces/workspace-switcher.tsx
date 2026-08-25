"use client"

import { Building2, Check, ChevronsUpDown, Plus, Settings2 } from "lucide-react"
import Link from "next/link"

import type { WorkspaceSummaryDto } from "@/features/workspaces/workspace.types"

type WorkspaceSwitcherProps = {
  activeWorkspace: WorkspaceSummaryDto | null
  collapsed: boolean
  open: boolean
  pending: boolean
  workspaces: WorkspaceSummaryDto[]
  onNavigate: () => void
  onSelect: (workspaceId: string) => void
  onToggle: () => void
}

export function WorkspaceSwitcher({
  activeWorkspace,
  collapsed,
  open,
  pending,
  workspaces,
  onNavigate,
  onSelect,
  onToggle,
}: WorkspaceSwitcherProps) {
  return (
    <div className={`relative px-3 pt-4 ${collapsed ? "lg:px-2" : ""}`}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-haspopup="menu"
        title={collapsed ? (activeWorkspace?.name ?? "Choose workspace") : undefined}
        className={`flex w-full items-center rounded-xl border border-cyan-300/25 bg-blue-950/65 text-left text-white transition-colors hover:border-cyan-300/50 hover:bg-blue-900/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${
          collapsed ? "justify-center p-2 lg:px-2" : "gap-3 px-3 py-3"
        }`}
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-cyan-400 text-white shadow-[0_0_14px_rgba(34,211,238,0.35)]">
          <Building2 size={18} />
        </span>
        <span className={`min-w-0 flex-1 ${collapsed ? "lg:sr-only" : ""}`}>
          <span className="block text-cyan-100/55 text-[0.65rem] uppercase tracking-[0.14em]">Workspace</span>
          <span className="mt-0.5 block truncate font-semibold text-sm">{activeWorkspace?.name ?? "No workspace"}</span>
        </span>
        <ChevronsUpDown className={`shrink-0 text-cyan-100/55 ${collapsed ? "lg:hidden" : ""}`} size={16} />
      </button>

      {open && (
        <div
          role="menu"
          className={`absolute z-70 mt-2 overflow-hidden rounded-xl border border-cyan-300/30 bg-[#061326] p-2 shadow-[0_18px_50px_rgba(0,0,0,0.55),0_0_24px_rgba(34,211,238,0.14)] ${
            collapsed ? "left-full ml-2 w-64 lg:top-4" : "right-3 left-3"
          }`}
        >
          <p className="px-2 py-1.5 font-medium text-cyan-100/55 text-xs uppercase tracking-wider">Workspaces</p>
          <div className="max-h-52 overflow-y-auto">
            {workspaces.map((workspace) => (
              <button
                key={workspace.id}
                type="button"
                role="menuitemradio"
                aria-checked={workspace.id === activeWorkspace?.id}
                disabled={pending}
                onClick={() => onSelect(workspace.id)}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-cyan-50 text-sm hover:bg-cyan-300/10 disabled:opacity-60"
              >
                <span className="min-w-0 flex-1 truncate">{workspace.name}</span>
                {workspace.id === activeWorkspace?.id && <Check className="shrink-0 text-cyan-300" size={16} />}
              </button>
            ))}
          </div>
          <div className="mt-2 border-cyan-300/15 border-t pt-2">
            {activeWorkspace && (
              <Link
                role="menuitem"
                href={`/workspaces/${activeWorkspace.id}`}
                onClick={onNavigate}
                className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-cyan-100/80 text-sm hover:bg-cyan-300/10 hover:text-white"
              >
                <Settings2 size={16} /> Manage current workspace
              </Link>
            )}
            <Link
              role="menuitem"
              href="/workspaces"
              onClick={onNavigate}
              className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-cyan-100/80 text-sm hover:bg-cyan-300/10 hover:text-white"
            >
              <Building2 size={16} /> Manage workspaces
            </Link>
            <Link
              role="menuitem"
              href="/workspaces/new"
              onClick={onNavigate}
              className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-cyan-100/80 text-sm hover:bg-cyan-300/10 hover:text-white"
            >
              <Plus size={16} /> New workspace
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
