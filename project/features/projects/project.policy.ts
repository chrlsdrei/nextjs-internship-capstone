import type { BoardRole, ProjectManagementCapabilitiesDto } from "@/features/projects/project.types"

const boardRoleLabels: Record<BoardRole, string> = {
  board_admin: "Board administrator",
  editor: "Editor",
  viewer: "Viewer",
}

export function boardRoleLabel(role: BoardRole) {
  return boardRoleLabels[role]
}

export function projectManagementCapabilities(role: BoardRole): ProjectManagementCapabilitiesDto {
  const isBoardAdministrator = role === "board_admin"
  return {
    canManageDetails: isBoardAdministrator,
    canManageMembers: isBoardAdministrator,
    canManageBoardRules: isBoardAdministrator,
    canDeleteProject: isBoardAdministrator,
  }
}
