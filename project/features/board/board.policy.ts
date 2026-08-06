import type { BoardCapabilitiesDto } from "@/features/board/board.types"
import type { BoardRole } from "@/features/projects/project.types"

export function boardCapabilities(role: BoardRole, editorsCanAssignTasks: boolean): BoardCapabilitiesDto {
  const isBoardAdministrator = role === "board_admin"
  const canEditTasks = isBoardAdministrator || role === "editor"
  return {
    canManageLists: isBoardAdministrator,
    canEditTasks,
    canAssignTasks: isBoardAdministrator || (role === "editor" && editorsCanAssignTasks),
    canDeleteTasks: isBoardAdministrator,
  }
}
