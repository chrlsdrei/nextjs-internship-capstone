import { notFound } from "next/navigation"

import { WorkspaceHeader } from "@/features/workspaces/components/workspace-header"
import { WorkspaceSettingsController } from "@/features/workspaces/controllers/workspace-settings.controller"
import { getWorkspaceDetails, WorkspaceAccessError } from "@/features/workspaces/server/workspace.service"
import { workspaceIdSchema } from "@/features/workspaces/workspace.schema"

export default async function WorkspaceSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const parsedId = workspaceIdSchema.safeParse((await params).id)
  if (!parsedId.success) notFound()

  try {
    const workspace = await getWorkspaceDetails(parsedId.data)
    return (
      <div className="space-y-6">
        <WorkspaceHeader current="settings" workspace={workspace} />
        <WorkspaceSettingsController workspace={workspace} />
      </div>
    )
  } catch (error) {
    if (error instanceof WorkspaceAccessError && error.status === 404) notFound()
    throw error
  }
}
