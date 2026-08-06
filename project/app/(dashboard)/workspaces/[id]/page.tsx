import { notFound } from "next/navigation"

import { WorkspaceHeader } from "@/features/workspaces/components/workspace-header"
import { WorkspaceOverview } from "@/features/workspaces/components/workspace-overview"
import { getWorkspaceDetails, WorkspaceAccessError } from "@/features/workspaces/server/workspace.service"
import { workspaceIdSchema } from "@/features/workspaces/workspace.schema"

export default async function WorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const parsedId = workspaceIdSchema.safeParse((await params).id)
  if (!parsedId.success) notFound()

  try {
    const workspace = await getWorkspaceDetails(parsedId.data)
    return (
      <div className="space-y-6">
        <WorkspaceHeader current="overview" workspace={workspace} />
        <WorkspaceOverview workspace={workspace} />
      </div>
    )
  } catch (error) {
    if (error instanceof WorkspaceAccessError && error.status === 404) notFound()
    throw error
  }
}
