import { notFound } from "next/navigation"

import { BillingPanelController } from "@/features/billing/controllers/billing-panel.controller"
import { getWorkspaceBilling } from "@/features/billing/server/billing.service"
import { WorkspaceHeader } from "@/features/workspaces/components/workspace-header"
import { WorkspaceSettingsController } from "@/features/workspaces/controllers/workspace-settings.controller"
import { getWorkspaceDetails, WorkspaceAccessError } from "@/features/workspaces/server/workspace.service"
import { workspaceIdSchema } from "@/features/workspaces/workspace.schema"

export default async function WorkspaceSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const parsedId = workspaceIdSchema.safeParse((await params).id)
  if (!parsedId.success) notFound()

  try {
    const [workspace, billing] = await Promise.all([
      getWorkspaceDetails(parsedId.data),
      getWorkspaceBilling(parsedId.data),
    ])
    return (
      <div className="space-y-6">
        <WorkspaceHeader current="settings" workspace={workspace} />
        <WorkspaceSettingsController workspace={workspace} />
        <BillingPanelController
          title="Workspace Pro access"
          description="Unlock AI board summaries and higher project and member capacity for 30 days."
          plans={billing.plans}
          access={billing.access}
          workspaceId={workspace.id}
          canManage={billing.canManage}
        />
      </div>
    )
  } catch (error) {
    if (error instanceof WorkspaceAccessError && error.status === 404) notFound()
    throw error
  }
}
