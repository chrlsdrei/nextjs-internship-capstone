import { redirect } from "next/navigation"

import { ActivityHistoryController } from "@/controllers/projects/activity-history.controller"
import { BoardController } from "@/controllers/projects/board/board.controller"
import { ProjectEventsController } from "@/controllers/projects/board/project-events.controller"
import { listProjectActivity } from "@/features/activity/queries/list-project-activity"
import { getBoardAiData } from "@/features/ai/queries/get-board-ai-data"
import { getProjectBoard } from "@/features/board/queries/get-project-board"
import { ProjectAccessError } from "@/features/projects/project.error"
import { projectIdSchema } from "@/features/projects/project.schema"
import { getProjectById } from "@/features/projects/queries/get-project-by-id"

export default async function ProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params
  const parsedProjectId = projectIdSchema.safeParse(projectId)
  if (!parsedProjectId.success) redirect("/projects")

  try {
    const [project, board, aiData] = await Promise.all([
      getProjectById(parsedProjectId.data),
      getProjectBoard(parsedProjectId.data),
      getBoardAiData(parsedProjectId.data),
    ])
    const canManage = board.role === "board_admin"
    const activity = canManage ? await listProjectActivity({ projectId: project.id, limit: 30 }) : null
    return (
      <div className="space-y-6">
        <ProjectEventsController projectId={project.id}>
          <div className="space-y-6">
            <BoardController
              projectId={project.id}
              projectTitle={project.title}
              projectDescription={project.description}
              serverBoard={board}
              aiData={aiData}
            />
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
