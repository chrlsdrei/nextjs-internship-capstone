import { ActionFeedback } from "@/components/ui/action-feedback"
import { TechFrameCard } from "@/components/ui/tech-frame-card"
import type { WorkspaceDetailDto } from "@/features/workspaces/workspace.types"
import type { ActionState } from "@/lib/action-state"

type FormController = {
  action: (payload: FormData) => void
  pending: boolean
  state: ActionState
}

type WorkspaceSettingsProps = {
  workspace: WorkspaceDetailDto
  details: FormController
  rules: FormController
}

const framedSectionContentClass =
  "min-h-0 gap-0 px-[clamp(2.5rem,5vw,6rem)] py-6 sm:min-h-0 sm:px-[clamp(2.5rem,5vw,6rem)] sm:py-8"

export function WorkspaceSettings({ workspace, details, rules }: WorkspaceSettingsProps) {
  if (!workspace.capabilities.canManageSettings) {
    return (
      <TechFrameCard className="w-full" contentClassName={framedSectionContentClass}>
        <h2 className="font-semibold text-cyan-50 text-lg">Workspace settings</h2>
        <p className="mt-2 text-cyan-100/65 text-sm">
          Only the workspace owner can change workspace details and project-creation rules.
        </p>
        <dl className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-cyan-100/60 text-sm">Name</dt>
            <dd className="mt-1 font-medium text-white">{workspace.name}</dd>
          </div>
          <div>
            <dt className="text-cyan-100/60 text-sm">Members can create projects</dt>
            <dd className="mt-1 font-medium text-white">
              {workspace.membersCanCreateProjects ? "Enabled" : "Disabled"}
            </dd>
          </div>
        </dl>
      </TechFrameCard>
    )
  }

  return (
    <div className="space-y-6">
      <TechFrameCard className="w-full" contentClassName={framedSectionContentClass}>
        <h2 className="font-semibold text-cyan-50 text-lg">Workspace details</h2>
        <form action={details.action} className="mt-5 space-y-4">
          <input type="hidden" name="workspaceId" value={workspace.id} />
          <label className="block font-medium text-cyan-50 text-sm">
            Name
            <input
              name="name"
              required
              maxLength={100}
              defaultValue={workspace.name}
              className="mt-2 w-full rounded-lg border border-cyan-300/30 bg-blue-950/65 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-300/40"
            />
          </label>
          <label className="block font-medium text-cyan-50 text-sm">
            Description
            <textarea
              name="description"
              maxLength={500}
              rows={4}
              defaultValue={workspace.description ?? ""}
              className="mt-2 w-full rounded-lg border border-cyan-300/30 bg-blue-950/65 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-300/40"
            />
          </label>
          <button
            type="submit"
            disabled={details.pending}
            className="rounded-lg bg-cyan-500 px-4 py-2 font-medium text-blue-950 hover:bg-cyan-300 disabled:opacity-60"
          >
            {details.pending ? "Saving…" : "Save details"}
          </button>
          <ActionFeedback state={details.state} />
        </form>
      </TechFrameCard>

      <TechFrameCard className="w-full" contentClassName={framedSectionContentClass}>
        <h2 className="font-semibold text-cyan-50 text-lg">Project creation</h2>
        <p className="mt-1 text-cyan-100/65 text-sm">
          Choose whether regular workspace members may create projects. Workspace administrators are governed by the
          same explicit project-access rules.
        </p>
        <form action={rules.action} className="mt-5">
          <input type="hidden" name="workspaceId" value={workspace.id} />
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              name="membersCanCreateProjects"
              value="true"
              defaultChecked={workspace.membersCanCreateProjects}
              className="mt-1 size-4 accent-blue-munsell-500"
            />
            <span>
              <span className="block font-medium text-sm">Allow members to create projects</span>
              <span className="mt-1 block text-cyan-100/65 text-sm">
                Members may select this workspace when creating a project. Administrators and the owner always may.
              </span>
            </span>
          </label>
          <button
            type="submit"
            disabled={rules.pending}
            className="mt-5 rounded-lg bg-cyan-500 px-4 py-2 font-medium text-blue-950 hover:bg-cyan-300 disabled:opacity-60"
          >
            {rules.pending ? "Saving…" : "Save rule"}
          </button>
          <ActionFeedback state={rules.state} />
        </form>
      </TechFrameCard>
    </div>
  )
}
