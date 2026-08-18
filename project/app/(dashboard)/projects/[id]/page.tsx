import { redirect } from "next/navigation"

import { ActivityHistoryController } from "@/features/activity/controllers/activity-history.controller"
import { listProjectActivity } from "@/features/activity/server/activity.service"
import { getBoardAiData } from "@/features/ai/server/ai-generation.service"
import { getBillingPlans } from "@/features/billing/server/billing.service"
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
    const [project, board, aiData, plans] = await Promise.all([
      getProjectById(parsedProjectId.data),
      getProjectBoard(parsedProjectId.data),
      getBoardAiData(parsedProjectId.data),
      getBillingPlans(),
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
              workspaceId={project.workspaceId}
              aiData={aiData}
              userAiPlan={plans.find((plan) => plan.target === "user" && plan.amount > 0) ?? null}
              workspacePlan={plans.find((plan) => plan.target === "workspace" && plan.amount > 0) ?? null}
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
