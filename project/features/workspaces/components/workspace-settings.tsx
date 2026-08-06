import { ActionFeedback } from "@/components/ui/action-feedback"
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

export function WorkspaceSettings({ workspace, details, rules }: WorkspaceSettingsProps) {
  if (!workspace.capabilities.canManageSettings) {
    return (
      <section className="rounded-xl border border-french-gray-300 bg-white p-6 dark:border-paynes-gray-400 dark:bg-outer-space-500">
        <h2 className="font-semibold text-lg text-outer-space-500 dark:text-platinum-500">Workspace settings</h2>
        <p className="mt-2 text-paynes-gray-500 text-sm dark:text-french-gray-400">
          Only the workspace owner can change workspace details and project-creation rules.
        </p>
        <dl className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-paynes-gray-500 text-sm dark:text-french-gray-400">Name</dt>
            <dd className="mt-1 font-medium">{workspace.name}</dd>
          </div>
          <div>
            <dt className="text-paynes-gray-500 text-sm dark:text-french-gray-400">Members can create projects</dt>
            <dd className="mt-1 font-medium">{workspace.membersCanCreateProjects ? "Enabled" : "Disabled"}</dd>
          </div>
        </dl>
      </section>
    )
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-french-gray-300 bg-white p-6 dark:border-paynes-gray-400 dark:bg-outer-space-500">
        <h2 className="font-semibold text-lg text-outer-space-500 dark:text-platinum-500">Workspace details</h2>
        <form action={details.action} className="mt-5 space-y-4">
          <input type="hidden" name="workspaceId" value={workspace.id} />
          <label className="block font-medium text-sm">
            Name
            <input
              name="name"
              required
              maxLength={100}
              defaultValue={workspace.name}
              className="mt-2 w-full rounded-lg border border-french-gray-300 bg-white px-3 py-2 dark:border-paynes-gray-400 dark:bg-outer-space-400"
            />
          </label>
          <label className="block font-medium text-sm">
            Description
            <textarea
              name="description"
              maxLength={500}
              rows={4}
              defaultValue={workspace.description ?? ""}
              className="mt-2 w-full rounded-lg border border-french-gray-300 bg-white px-3 py-2 dark:border-paynes-gray-400 dark:bg-outer-space-400"
            />
          </label>
          <button
            type="submit"
            disabled={details.pending}
            className="rounded-lg bg-blue-munsell-500 px-4 py-2 font-medium text-white hover:bg-blue-munsell-600 disabled:opacity-60"
          >
            {details.pending ? "Saving…" : "Save details"}
          </button>
          <ActionFeedback state={details.state} />
        </form>
      </section>

      <section className="rounded-xl border border-french-gray-300 bg-white p-6 dark:border-paynes-gray-400 dark:bg-outer-space-500">
        <h2 className="font-semibold text-lg text-outer-space-500 dark:text-platinum-500">Project creation</h2>
        <p className="mt-1 text-paynes-gray-500 text-sm dark:text-french-gray-400">
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
              <span className="mt-1 block text-paynes-gray-500 text-sm dark:text-french-gray-400">
                This setting will be enforced when projects are connected to workspaces.
              </span>
            </span>
          </label>
          <button
            type="submit"
            disabled={rules.pending}
            className="mt-5 rounded-lg bg-blue-munsell-500 px-4 py-2 font-medium text-white hover:bg-blue-munsell-600 disabled:opacity-60"
          >
            {rules.pending ? "Saving…" : "Save rule"}
          </button>
          <ActionFeedback state={rules.state} />
        </form>
      </section>
    </div>
  )
}
