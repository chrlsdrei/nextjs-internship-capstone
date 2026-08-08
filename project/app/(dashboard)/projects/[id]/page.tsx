import { ArrowLeft, Settings } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

import { ActivityHistoryController } from "@/features/activity/controllers/activity-history.controller"
import { listProjectActivity } from "@/features/activity/server/activity.service"
import { BoardController } from "@/features/board/controllers/board.controller"
import { ProjectEventsController } from "@/features/board/controllers/project-events.controller"
import { getProjectBoard } from "@/features/board/server/board.service"
import { projectIdSchema } from "@/features/projects/project.schema"
import { getProjectById } from "@/features/projects/server/project.service"
import { ProjectAccessError } from "@/features/projects/server/project-access.service"

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const parsedProjectId = projectIdSchema.safeParse(id)
  if (!parsedProjectId.success) redirect("/projects")

  try {
    const [project, board] = await Promise.all([
      getProjectById(parsedProjectId.data),
      getProjectBoard(parsedProjectId.data),
    ])
    const canManage = board.role === "board_admin"
    const activity = canManage ? await listProjectActivity({ projectId: project.id, limit: 30 }) : null
    return (
      <div className="space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <Link
              href="/projects"
              className="mt-1 rounded p-2 hover:bg-platinum-500 dark:hover:bg-paynes-gray-400"
              aria-label="Back to projects"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-outer-space-500 dark:text-platinum-500">{project.title}</h1>
              <p className="mt-1 max-w-3xl text-paynes-gray-500 dark:text-french-gray-400">
                {project.description || "Plan and track this project’s work."}
              </p>
            </div>
          </div>
          {canManage && (
            <Link
              href={`/projects/${project.id}/members`}
              className="inline-flex items-center gap-2 self-start rounded-lg border border-french-gray-300 px-3 py-2 text-sm font-medium hover:bg-platinum-500 dark:border-paynes-gray-400 dark:hover:bg-paynes-gray-400"
            >
              <Settings size={16} /> Manage project
            </Link>
          )}
        </header>
        <ProjectEventsController projectId={project.id}>
          <div className="space-y-6">
            <BoardController projectId={project.id} serverBoard={board} />
            {activity && <ActivityHistoryController projectId={project.id} initialPage={activity} />}
          </div>
        </ProjectEventsController>
      </div>
    )
  } catch (error) {
    if (error instanceof ProjectAccessError) redirect("/projects")
    throw error
  }
}
