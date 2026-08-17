import { Calendar, Users } from "lucide-react"
import Link from "next/link"

import { OrnamentalFrame } from "@/components/ui/ornamental-frame"
import type { ProjectSummaryDto } from "@/features/projects/project.types"
import type { WorkspaceSummaryDto } from "@/features/workspaces/workspace.types"
import { groupProjectsByWorkspace } from "@/features/workspaces/workspace-projects"

export function RecentProjects({
  projects,
  workspaces,
}: {
  projects: ProjectSummaryDto[]
  workspaces: WorkspaceSummaryDto[]
}) {
  const groups = groupProjectsByWorkspace(workspaces, projects)
  return (
    <OrnamentalFrame
      title="Recent Projects"
      actions={
        <Link href="/projects" className="font-medium text-cyan-300 text-sm hover:text-cyan-100">
          View all
        </Link>
      }
      className="w-full"
      contentClassName="px-[clamp(2.75rem,5vw,5rem)] pb-10 pt-5"
    >
      <section aria-label="Recent projects">
        {projects.length === 0 ? (
          <p className="text-cyan-100/70 text-sm">No projects yet. Create one to get started.</p>
        ) : (
          <div className="space-y-6">
            {groups.map((group) => (
              <section key={group.key}>
                <h3 className="mb-2 font-medium text-cyan-100/70 text-sm">{group.name}</h3>
                <div className="space-y-3">
                  {group.projects.map((project) => (
                    <Link
                      key={project.id}
                      href={`/projects/${project.id}`}
                      className="block rounded-lg border border-cyan-300/25 bg-blue-950/45 p-4 transition-colors hover:border-cyan-300/55 hover:bg-blue-900/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                    >
                      <h4 className="font-medium text-white">{project.title}</h4>
                      <p className="mt-1 line-clamp-1 text-cyan-100/65 text-sm">
                        {project.description || "No description yet."}
                      </p>
                      <div className="mt-3 flex items-center gap-4 text-cyan-100/65 text-sm">
                        <span className="flex items-center gap-1">
                          <Users size={16} />
                          {project.memberCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={16} />
                          {project.dueDate
                            ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(
                                new Date(project.dueDate),
                              )
                            : "No due date"}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </section>
    </OrnamentalFrame>
  )
}
