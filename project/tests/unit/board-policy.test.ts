import { describe, expect, it } from "vitest"

import { boardCapabilities } from "../../features/board/board.policy"
import { boardRoleLabel, projectManagementCapabilities } from "../../features/projects/project.policy"

describe("board capabilities", () => {
  it("keeps board administrators in control of every board operation", () => {
    expect(boardCapabilities("board_admin", false)).toEqual({
      canManageLists: true,
      canEditTasks: true,
      canAssignTasks: true,
      canDeleteTasks: true,
      canLeaveBoard: false,
    })
  })

  it("applies the assignment rule only to editors", () => {
    expect(boardCapabilities("editor", false).canAssignTasks).toBe(false)
    expect(boardCapabilities("editor", true).canAssignTasks).toBe(true)
    expect(boardCapabilities("viewer", true)).toEqual({
      canManageLists: false,
      canEditTasks: false,
      canAssignTasks: false,
      canDeleteTasks: false,
      canLeaveBoard: false,
    })
  })
})

describe("project management capabilities", () => {
  it("uses the product-facing board role terminology", () => {
    expect(boardRoleLabel("board_admin")).toBe("Board administrator")
    expect(boardRoleLabel("editor")).toBe("Editor")
    expect(boardRoleLabel("viewer")).toBe("Viewer")
  })

  it("allows only effective board administrators to manage project configuration", () => {
    expect(projectManagementCapabilities("board_admin")).toEqual({
      canManageDetails: true,
      canManageMembers: true,
      canManageBoardRules: true,
      canDeleteProject: true,
    })
    expect(projectManagementCapabilities("editor").canManageBoardRules).toBe(false)
    expect(projectManagementCapabilities("viewer").canManageMembers).toBe(false)
  })
})
