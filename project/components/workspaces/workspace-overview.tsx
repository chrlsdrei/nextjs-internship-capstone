import { CalendarDays, FolderKanban, ShieldCheck, Users } from "lucide-react"
import Link from "next/link"

import { OrnamentalFrame } from "@/components/ui/ornamental-frame"
import { TaskFrame } from "@/components/ui/task-frame"
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
          <TaskFrame key={fact.label} className="min-h-36" contentClassName="flex h-full flex-col justify-center px-6">
            <fact.icon className="text-cyan-300" size={20} />
            <p className="mt-3 text-cyan-100/65 text-sm">{fact.label}</p>
            <p className="mt-1 font-semibold text-white capitalize">{fact.value}</p>
          </TaskFrame>
        ))}
      </div>
      <OrnamentalFrame
        title="Workspace projects"
        className="w-full"
        contentClassName="px-[clamp(2.75rem,6vw,6rem)] pb-10 pt-3"
      >
        <section className="flex items-start gap-3">
          <FolderKanban className="shrink-0 text-cyan-300" size={22} />
          <div>
            <p className="text-cyan-100/70 text-sm">
              Projects assigned to this workspace are available in the project directory, grouped by workspace.
            </p>
            <Link
              href={`/projects?workspace=${workspace.id}`}
              className="mt-4 inline-block rounded font-medium text-cyan-200 text-sm hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              View project directory
            </Link>
          </div>
        </section>
      </OrnamentalFrame>
    </div>
  )
}
