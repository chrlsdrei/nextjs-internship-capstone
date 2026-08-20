import { CalendarDays, FolderKanban, ShieldCheck, Users } from "lucide-react"
import Link from "next/link"

import type { WorkspaceDetailDto } from "@/features/workspaces/workspace.types"

export function WorkspaceOverview({ workspace }: { workspace: WorkspaceDetailDto }) {
  const createdAt = new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(workspace.createdAt))
  const facts = [
    { label: "Members", value: String(workspace.memberCount), icon: Users },
    { label: "Your role", value: workspace.role, icon: ShieldCheck },
    { label: "Created", value: createdAt, icon: CalendarDays },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {facts.map((fact) => (
          <div
            key={fact.label}
            className="rounded-xl border border-french-gray-300 bg-white p-5 dark:border-paynes-gray-400 dark:bg-outer-space-500"
          >
            <fact.icon className="text-blue-munsell-500" size={20} />
            <p className="mt-3 text-paynes-gray-500 text-sm dark:text-french-gray-400">{fact.label}</p>
            <p className="mt-1 font-semibold text-outer-space-500 capitalize dark:text-platinum-500">{fact.value}</p>
          </div>
        ))}
      </div>
      <section className="rounded-xl border border-french-gray-300 bg-white p-6 dark:border-paynes-gray-400 dark:bg-outer-space-500">
        <div className="flex items-start gap-3">
          <FolderKanban className="text-blue-munsell-500" size={22} />
          <div>
            <h2 className="font-semibold text-lg text-outer-space-500 dark:text-platinum-500">Workspace projects</h2>
            <p className="mt-1 text-paynes-gray-500 text-sm dark:text-french-gray-400">
              Projects assigned to this workspace are available in the project directory, grouped by workspace.
            </p>
            <Link
              href={`/projects?workspace=${workspace.id}`}
              className="mt-4 inline-block font-medium text-blue-munsell-600 text-sm hover:underline dark:text-blue-munsell-400"
            >
              View project directory
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
