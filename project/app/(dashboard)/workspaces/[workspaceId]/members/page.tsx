import { notFound } from "next/navigation"
import { WorkspaceHeader } from "@/components/workspaces/workspace-header"
import { WorkspaceMembersController } from "@/controllers/workspaces/workspace-members.controller"
import { listWorkspaceInvitations } from "@/features/invitations/queries/list-workspace-invitations"
import { getWorkspaceDetails, WorkspaceAccessError } from "@/features/workspaces/queries/get-workspace-details"
import { workspaceIdSchema } from "@/features/workspaces/workspace.schema"

export default async function WorkspaceMembersPage({ params }: { params: Promise<{ workspaceId: string }> }) {
  const parsedId = workspaceIdSchema.safeParse((await params).workspaceId)
  if (!parsedId.success) notFound()

  try {
    const workspace = await getWorkspaceDetails(parsedId.data)
    const invitations = workspace.capabilities.canInviteWorkspaceMembers
      ? await listWorkspaceInvitations(workspace.id)
      : []
    return (
      <div className="space-y-6">
        <WorkspaceHeader current="members" workspace={workspace} />
        <WorkspaceMembersController workspace={workspace} invitations={invitations} />
      </div>
    )
  } catch (error) {
    if (error instanceof WorkspaceAccessError && error.status === 404) notFound()
    throw error
  }
}
