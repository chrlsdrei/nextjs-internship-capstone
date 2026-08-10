import { notFound } from "next/navigation"
import { listWorkspaceInvitations } from "@/features/invitations/server/invitation.service"
import { WorkspaceHeader } from "@/features/workspaces/components/workspace-header"
import { WorkspaceMembersController } from "@/features/workspaces/controllers/workspace-members.controller"
import { getWorkspaceDetails, WorkspaceAccessError } from "@/features/workspaces/server/workspace.service"
import { workspaceIdSchema } from "@/features/workspaces/workspace.schema"

export default async function WorkspaceMembersPage({ params }: { params: Promise<{ id: string }> }) {
  const parsedId = workspaceIdSchema.safeParse((await params).id)
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
