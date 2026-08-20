import { beforeEach, describe, expect, it } from "vitest"
import { moveTaskOptimistically, useBoardStore } from "../../controllers/projects/board/board.store"
import type { BoardMemberDto, BoardTaskDto, ProjectBoardDto } from "../../features/board/board.types"
import {
  retainActiveMemberSelections,
  taskMatchesBoardFilters,
  toggleAssigneeFilter,
  toggleLabelFilter,
} from "../../features/board/board-filtering"
import type { LabelDto } from "../../features/labels/label.types"
import { labelTextColor } from "../../features/labels/label-color"

const redLabel: LabelDto = {
  id: "00000000-0000-4000-8000-000000000001",
  projectId: "00000000-0000-4000-8000-000000000010",
  name: "Urgent",
  color: "#dc2626",
  createdAt: "2026-08-08T00:00:00.000Z",
  updatedAt: "2026-08-08T00:00:00.000Z",
}

const blueLabel: LabelDto = {
  ...redLabel,
  id: "00000000-0000-4000-8000-000000000002",
  name: "Backend",
  color: "#2563eb",
}

const charles: BoardMemberDto = {
  id: "00000000-0000-4000-8000-000000000030",
  userId: "00000000-0000-4000-8000-000000000031",
  workspaceMemberId: "00000000-0000-4000-8000-000000000032",
  name: "Charles",
  email: "charles@example.com",
}

const ada: BoardMemberDto = {
  id: "00000000-0000-4000-8000-000000000033",
  userId: "00000000-0000-4000-8000-000000000034",
  workspaceMemberId: "00000000-0000-4000-8000-000000000035",
  name: "Ada",
  email: "ada@example.com",
}

const task: BoardTaskDto = {
  id: "00000000-0000-4000-8000-000000000020",
  title: "Build login page",
  description: "Connect Clerk",
  priority: "high",
  dueDate: null,
  position: 0,
  assignees: [charles, ada],
  labels: [redLabel],
}

const board: ProjectBoardDto = {
  role: "board_admin",
  capabilities: {
    canManageLists: true,
    canEditTasks: true,
    canAssignTasks: true,
    canDeleteTasks: true,
  },
  labels: [redLabel, blueLabel],
  members: [charles, ada],
  lists: [{ id: "00000000-0000-4000-8000-000000000040", name: "Todo", position: 0, tasks: [task] }],
}

describe("board label UI behavior", () => {
  beforeEach(() => {
    useBoardStore.setState({ projectId: null, board: null, isSaving: false, error: null })
  })

  it("uses OR semantics for labels and AND semantics with the other filters", () => {
    const matchingFilters = {
      search: "login",
      priority: "high" as const,
      assigneeIds: ["00000000-0000-4000-8000-000000000099", ada.id],
      includeUnassigned: false,
      labelIds: [blueLabel.id, redLabel.id],
    }

    expect(taskMatchesBoardFilters(task, matchingFilters)).toBe(true)
    expect(taskMatchesBoardFilters(task, { ...matchingFilters, labelIds: [blueLabel.id] })).toBe(false)
    expect(taskMatchesBoardFilters(task, { ...matchingFilters, priority: "low" })).toBe(false)
    expect(toggleLabelFilter([redLabel.id], blueLabel.id)).toEqual([redLabel.id, blueLabel.id])
    expect(toggleLabelFilter([redLabel.id, blueLabel.id], redLabel.id)).toEqual([blueLabel.id])
  })

  it("uses OR semantics for assignees and combines them with all other filter groups", () => {
    const filters = {
      search: "clerk",
      priority: "high" as const,
      assigneeIds: ["00000000-0000-4000-8000-000000000099", ada.id],
      includeUnassigned: false,
      labelIds: [redLabel.id],
    }
    expect(taskMatchesBoardFilters(task, filters)).toBe(true)
    expect(taskMatchesBoardFilters(task, { ...filters, assigneeIds: ["00000000-0000-4000-8000-000000000099"] })).toBe(
      false,
    )
    expect(
      taskMatchesBoardFilters({ ...task, assignees: [] }, { ...filters, assigneeIds: [], includeUnassigned: true }),
    ).toBe(true)
    expect(toggleAssigneeFilter([charles.id], ada.id)).toEqual([charles.id, ada.id])
  })

  it("removes selections for members no longer present on the board", () => {
    expect(retainActiveMemberSelections([charles.id, ada.id], [ada])).toEqual([ada.id])
  })

  it("retains every assignee when a task moves between lists", () => {
    const targetListId = "00000000-0000-4000-8000-000000000041"
    const boardWithTarget = {
      ...board,
      lists: [...board.lists, { id: targetListId, name: "Doing", position: 1, tasks: [] }],
    }
    const moved = moveTaskOptimistically(boardWithTarget, task.id, targetListId, 0)
    expect(moved.lists[1]?.tasks[0]?.assignees).toEqual([charles, ada])
    expect(moved.lists[1]?.tasks[0]?.position).toBe(0)
  })

  it("reorders tasks with array positions normalized for live drag previews", () => {
    const sourceList = board.lists[0]
    if (!sourceList) throw new Error("Expected the test board to contain a source list")
    const secondTask: BoardTaskDto = {
      ...task,
      id: "00000000-0000-4000-8000-000000000021",
      title: "Review login page",
      position: 1,
    }
    const thirdTask: BoardTaskDto = {
      ...task,
      id: "00000000-0000-4000-8000-000000000022",
      title: "Deploy login page",
      position: 2,
    }
    const boardWithTasks = {
      ...board,
      lists: [{ ...sourceList, tasks: [task, secondTask, thirdTask] }],
    }

    const reordered = moveTaskOptimistically(boardWithTasks, task.id, sourceList.id, 2)

    expect(reordered.lists[0]?.tasks.map((item) => item.id)).toEqual([secondTask.id, thirdTask.id, task.id])
    expect(reordered.lists[0]?.tasks.map((item) => item.position)).toEqual([0, 1, 2])
  })

  it("normalizes both columns when previewing a cross-column drag", () => {
    const sourceList = board.lists[0]
    if (!sourceList) throw new Error("Expected the test board to contain a source list")
    const secondTask: BoardTaskDto = {
      ...task,
      id: "00000000-0000-4000-8000-000000000021",
      title: "Review login page",
      position: 1,
    }
    const targetTask: BoardTaskDto = {
      ...task,
      id: "00000000-0000-4000-8000-000000000022",
      title: "Deploy login page",
      position: 0,
    }
    const targetListId = "00000000-0000-4000-8000-000000000041"
    const boardWithTarget = {
      ...board,
      lists: [
        { ...sourceList, tasks: [task, secondTask] },
        { id: targetListId, name: "Doing", position: 1, tasks: [targetTask] },
      ],
    }

    const moved = moveTaskOptimistically(boardWithTarget, task.id, targetListId, 1)

    expect(moved.lists[0]?.tasks.map((item) => [item.id, item.position])).toEqual([[secondTask.id, 0]])
    expect(moved.lists[1]?.tasks.map((item) => [item.id, item.position])).toEqual([
      [targetTask.id, 0],
      [task.id, 1],
    ])
  })

  it("does not publish a new Zustand state for a no-op drag preview", () => {
    const projectId = redLabel.projectId
    const sourceList = board.lists[0]
    if (!sourceList) throw new Error("Expected the test board to contain a source list")
    useBoardStore.getState().setBoard(projectId, board)
    const stateBeforePreview = useBoardStore.getState()

    stateBeforePreview.moveTaskOptimistically(projectId, board, task.id, sourceList.id, 0)

    expect(useBoardStore.getState()).toBe(stateBeforePreview)
  })

  it("selects a readable foreground for light and dark label colors", () => {
    expect(labelTextColor("#ffff00")).toBe("#000000")
    expect(labelTextColor("#000080")).toBe("#ffffff")
  })

  it("restores the prior Zustand board after an optimistic label mutation fails", () => {
    const projectId = redLabel.projectId
    useBoardStore.getState().setBoard(projectId, board)

    const previous = useBoardStore
      .getState()
      .setTaskLabelsOptimistically(projectId, board, task.id, [redLabel, blueLabel])

    expect(useBoardStore.getState().board?.lists[0]?.tasks[0]?.labels).toEqual([redLabel, blueLabel])

    useBoardStore.getState().restoreBoard(projectId, previous)

    expect(useBoardStore.getState().board?.lists[0]?.tasks[0]?.labels).toEqual([redLabel])
  })

  it("restores assignees and labels together after an optimistic task save fails", () => {
    const projectId = redLabel.projectId
    useBoardStore.getState().setBoard(projectId, board)
    const previous = useBoardStore.getState().setTaskCollaborationOptimistically(projectId, board, task.id, {
      assignees: [ada],
      labels: [blueLabel],
    })

    expect(useBoardStore.getState().board?.lists[0]?.tasks[0]).toMatchObject({
      assignees: [ada],
      labels: [blueLabel],
    })

    useBoardStore.getState().restoreBoard(projectId, previous)
    expect(useBoardStore.getState().board?.lists[0]?.tasks[0]).toMatchObject({
      assignees: [charles, ada],
      labels: [redLabel],
    })
  })
})
