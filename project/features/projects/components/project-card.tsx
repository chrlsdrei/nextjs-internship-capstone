import { Calendar, Settings, Users } from "lucide-react"
import Link from "next/link"

import type { ProjectSummaryDto } from "@/features/projects/project.types"

export function ProjectCard({ project }: { project: ProjectSummaryDto }) {
  const dueDate = project.dueDate
    ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(
        new Date(project.dueDate),
      )
    : "No due date"

  return (
    <article className="bg-white dark:bg-outer-space-500 rounded-lg border border-french-gray-300 dark:border-paynes-gray-400 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between gap-4 mb-4">
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-munsell-100 text-blue-munsell-700 dark:bg-blue-munsell-900 dark:text-blue-munsell-300 capitalize">
          {project.role}
        </span>
        {project.role !== "member" && (
          <Link
            href={`/projects/${project.id}/members`}
            className="p-1 hover:bg-platinum-500 dark:hover:bg-paynes-gray-400 rounded"
            aria-label={`Manage ${project.name}`}
          >
            <Settings size={16} />
          </Link>
        )}
      </div>

      <Link
        href={`/projects/${project.id}`}
        className="block focus:outline-none focus:ring-2 focus:ring-blue-munsell-500 rounded"
      >
        <h2 className="text-lg font-semibold text-outer-space-500 dark:text-platinum-500 mb-2">{project.name}</h2>
        <p className="text-sm text-paynes-gray-500 dark:text-french-gray-400 mb-4 line-clamp-2 min-h-10">
          {project.description || "No description yet."}
        </p>
      </Link>

      <div className="flex items-center justify-between gap-3 text-sm text-paynes-gray-500 dark:text-french-gray-400">
        <span className="flex items-center gap-1">
          <Users size={16} />
          {project.memberCount} {project.memberCount === 1 ? "member" : "members"}
        </span>
        <span className="flex items-center gap-1">
          <Calendar size={16} />
          {dueDate}
        </span>
      </div>
      <p className="mt-4 text-sm text-paynes-gray-500 dark:text-french-gray-400">
        {project.taskCount} {project.taskCount === 1 ? "task" : "tasks"}
      </p>
    </article>
  )
}
