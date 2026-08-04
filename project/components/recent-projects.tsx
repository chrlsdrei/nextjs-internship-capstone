import { Calendar, Users } from "lucide-react"
import Link from "next/link"

import type { ProjectSummary } from "@/lib/db/queries/projects"

export function RecentProjects({ projects }: { projects: ProjectSummary[] }) {
  return (
    <section className="bg-white dark:bg-outer-space-500 rounded-lg border border-french-gray-300 dark:border-paynes-gray-400 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-outer-space-500 dark:text-platinum-500">Recent Projects</h2>
        <Link href="/projects" className="text-blue-munsell-500 hover:text-blue-munsell-600 text-sm font-medium">
          View all
        </Link>
      </div>
      {projects.length === 0 ? (
        <p className="text-sm text-paynes-gray-500 dark:text-french-gray-400">
          No projects yet. Create one to get started.
        </p>
      ) : (
        <div className="space-y-3">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="block border border-french-gray-300 dark:border-paynes-gray-400 rounded-lg p-4 hover:bg-platinum-800 dark:hover:bg-outer-space-400"
            >
              <h3 className="font-medium text-outer-space-500 dark:text-platinum-500">{project.name}</h3>
              <p className="mt-1 text-sm text-paynes-gray-500 dark:text-french-gray-400 line-clamp-1">
                {project.description || "No description yet."}
              </p>
              <div className="mt-3 flex items-center gap-4 text-sm text-paynes-gray-500 dark:text-french-gray-400">
                <span className="flex items-center gap-1">
                  <Users size={16} />
                  {project.memberCount}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar size={16} />
                  {project.dueDate
                    ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(project.dueDate)
                    : "No due date"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
