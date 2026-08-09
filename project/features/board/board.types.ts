import type { LabelDto } from "@/features/labels/label.types"
import type { BoardRole } from "@/features/projects/project.types"

export type BoardMemberDto = {
  id: string
  userId: string
  workspaceMemberId: string
  name: string
  email: string
}

export type BoardTaskDto = {
  id: string
  title: string
  description: string | null
  priority: "low" | "medium" | "high"
  dueDate: string | null
  position: number
  assignees: BoardMemberDto[]
  /** Temporary single-assignee compatibility alias; removed by Step 15. */
  assignee: BoardMemberDto | null
  labels: LabelDto[]
}

export type BoardListDto = {
  id: string
  name: string
  position: number
  tasks: BoardTaskDto[]
}

export type BoardCapabilitiesDto = {
  canManageLists: boolean
  canEditTasks: boolean
  canAssignTasks: boolean
  canDeleteTasks: boolean
}

export type ProjectBoardDto = {
  lists: BoardListDto[]
  members: BoardMemberDto[]
  labels: LabelDto[]
  role: BoardRole
  capabilities: BoardCapabilitiesDto
}

export type MoveTaskCommand = {
  projectId: string
  taskId: string
  sourceListId: string
  targetListId: string
  targetIndex: number
}

export type ReorderTasksCommand = {
  projectId: string
  listId: string
  taskIds: string[]
}

export type SetTaskAssigneesCommand = {
  projectId: string
  taskId: string
  projectMemberIds: string[]
}

export type ChangeTaskAssigneeCommand = {
  projectId: string
  taskId: string
  projectMemberId: string
}
