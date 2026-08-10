import type { BoardRole } from "@/features/projects/project.types"

export function commentCapabilities(
  role: BoardRole,
  actorWorkspaceMemberId: string,
  authorWorkspaceMemberId: string | null,
  deletedAt: Date | string | null,
) {
  const canModerate = role === "board_admin"
  const canParticipate = canModerate || role === "editor"
  const isAuthor = authorWorkspaceMemberId === actorWorkspaceMemberId
  const isDeleted = deletedAt !== null
  return {
    canCreate: canParticipate,
    canEdit: !isDeleted && ((canParticipate && isAuthor) || canModerate),
    canDelete: !isDeleted && ((canParticipate && isAuthor) || canModerate),
    canModerate,
  }
}
