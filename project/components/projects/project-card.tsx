import { Calendar, Settings, Users } from "lucide-react"
import Link from "next/link"

import { OrnamentalFrame } from "@/components/ui/ornamental-frame"
import { boardRoleLabel } from "@/features/projects/project.policy"
import type { ProjectSummaryDto } from "@/features/projects/project.types"

export function ProjectCard({ project }: { project: ProjectSummaryDto }) {
  const dueDate = project.dueDate
    ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(
        new Date(project.dueDate),
      )
    : "No due date"

  return (
    <OrnamentalFrame
      className="h-full min-h-[19rem] transition-transform duration-200 hover:-translate-y-0.5"
      contentClassName="h-full px-[clamp(2.75rem,4vw,4rem)] pb-10 pt-8"
    >
      <article className="flex h-full min-h-0 flex-col">
        <div className="mb-5 flex items-start justify-between gap-4">
          <span className="rounded-full bg-cyan-400/15 px-2.5 py-1 font-medium text-cyan-200 text-xs capitalize ring-1 ring-cyan-300/25">
            {boardRoleLabel(project.role)}
          </span>
          {project.role === "board_admin" && (
            <Link
              href={`/projects/${project.id}/members`}
              className="rounded p-1.5 text-cyan-100 transition-colors hover:bg-cyan-300/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              aria-label={`Manage ${project.title}`}
            >
              <Settings size={16} />
            </Link>
          )}
        </div>

        <Link
          href={`/projects/${project.id}`}
          className="rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
        >
          <h2 className="mb-2 font-semibold text-lg text-white">{project.title}</h2>
          <p className="mb-5 line-clamp-2 min-h-10 text-cyan-100/70 text-sm">
            {project.description || "No description yet."}
          </p>
        </Link>

        <div className="mt-auto flex items-center justify-between gap-3 text-cyan-100/70 text-sm">
          <span className="flex items-center gap-1.5">
            <Users size={16} />
            {project.memberCount} {project.memberCount === 1 ? "member" : "members"}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar size={16} />
            {dueDate}
          </span>
        </div>
        <p className="mt-4 text-cyan-100/70 text-sm">
          {project.taskCount} {project.taskCount === 1 ? "task" : "tasks"}
        </p>
      </article>
    </OrnamentalFrame>
  )
}
