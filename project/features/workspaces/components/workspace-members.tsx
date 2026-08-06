import { Mail } from "lucide-react"

import type { WorkspaceDetailDto } from "@/features/workspaces/workspace.types"

import { WorkspaceRoleBadge } from "./workspace-role-badge"

export function WorkspaceMembers({ workspace }: { workspace: WorkspaceDetailDto }) {
  return (
    <section className="rounded-xl border border-french-gray-300 bg-white p-6 dark:border-paynes-gray-400 dark:bg-outer-space-500">
      <div>
        <h2 className="font-semibold text-lg text-outer-space-500 dark:text-platinum-500">Workspace members</h2>
        <p className="mt-1 text-paynes-gray-500 text-sm dark:text-french-gray-400">
          Active members with access to this workspace. Invitation and ownership controls are added in a later phase.
        </p>
      </div>
      <div className="mt-5 divide-y divide-french-gray-300 dark:divide-paynes-gray-400">
        {workspace.members.map((member) => (
          <article key={member.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="font-medium text-outer-space-500 dark:text-platinum-500">{member.name}</p>
              <p className="mt-1 inline-flex items-center gap-2 truncate text-paynes-gray-500 text-sm dark:text-french-gray-400">
                <Mail size={14} /> {member.email}
              </p>
            </div>
            <WorkspaceRoleBadge role={member.role} />
          </article>
        ))}
      </div>
    </section>
  )
}
