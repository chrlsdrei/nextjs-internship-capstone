import type { ReactNode } from "react"
import { PendingProjectInvitations } from "@/components/projects/members/pending-project-invitations"
import { ActionFeedback } from "@/components/ui/action-feedback"
import { TechFrameCard } from "@/components/ui/tech-frame-card"
import type { ProjectManagementDto } from "@/features/members/member.types"
import { boardRoleLabel } from "@/features/projects/project.policy"
import type { ActionState } from "@/lib/action-state"

type FormController = {
  action: (payload: FormData) => void
  pending: boolean
  state: ActionState
}

type ProjectMemberManagerProps = ProjectManagementDto & {
  inviteMember: FormController
  resendInvitation: FormController
  revokeInvitation: FormController
  deleteProject: FormController
  updateProject: FormController
  updateRules: FormController
  renderMember: (member: ProjectManagementDto["members"][number]) => ReactNode
}

const framedSectionContentClass =
  "gap-0 px-[clamp(2.5rem,5vw,6rem)] py-6 sm:min-h-0 sm:px-[clamp(2.5rem,5vw,6rem)] sm:py-8"

export function ProjectMemberManager({
  project,
  workspace,
  settings,
  capabilities,
  members,
  availableWorkspaceMembers,
  invitations,
  workspaceOwner,
  inviteMember,
  resendInvitation,
  revokeInvitation,
  deleteProject,
  updateProject,
  updateRules,
  renderMember,
}: ProjectMemberManagerProps) {
  const dateValue = project.dueDate?.slice(0, 10) ?? ""

  return (
    <div className="space-y-6">
      {capabilities.canManageDetails && (
        <TechFrameCard className="w-full" contentClassName={framedSectionContentClass}>
          <h2 className="font-semibold text-lg text-outer-space-500 dark:text-platinum-500">Project settings</h2>
          <p className="mt-1 text-paynes-gray-500 text-sm dark:text-french-gray-400">
            Workspace: <span className="font-medium text-outer-space-500 dark:text-platinum-500">{workspace.name}</span>
          </p>
          <form action={updateProject.action} className="mt-4 grid gap-4">
            <input type="hidden" name="projectId" value={project.id} />
            <label className="font-medium text-sm">
              Title
              <input
                name="title"
                required
                maxLength={100}
                defaultValue={project.title}
                className="mt-1 w-full rounded border border-french-gray-300 bg-white px-3 py-2 dark:border-paynes-gray-400 dark:bg-outer-space-400"
              />
            </label>
            <label className="font-medium text-sm">
              Description
              <textarea
                name="description"
                maxLength={500}
                defaultValue={project.description ?? ""}
                className="mt-1 w-full rounded border border-french-gray-300 bg-white px-3 py-2 dark:border-paynes-gray-400 dark:bg-outer-space-400"
              />
            </label>
            <label className="font-medium text-sm">
              Due date
              <input
                name="dueDate"
                type="date"
                defaultValue={dateValue}
                className="mt-1 w-full rounded border border-french-gray-300 bg-white px-3 py-2 dark:border-paynes-gray-400 dark:bg-outer-space-400"
              />
            </label>
            <div>
              <button
                type="submit"
                disabled={updateProject.pending}
                className="rounded bg-blue-munsell-500 px-4 py-2 text-white disabled:opacity-60"
              >
                {updateProject.pending ? "Saving…" : "Save settings"}
              </button>
              <ActionFeedback state={updateProject.state} />
            </div>
          </form>
        </TechFrameCard>
      )}

      {capabilities.canManageBoardRules && (
        <TechFrameCard className="w-full" contentClassName={framedSectionContentClass}>
          <h2 className="font-semibold text-lg text-outer-space-500 dark:text-platinum-500">Board permissions</h2>
          <p className="mt-1 text-paynes-gray-500 text-sm dark:text-french-gray-400">
            Control whether editors may assign and unassign project members on tasks.
          </p>
          <form action={updateRules.action} className="mt-5">
            <input type="hidden" name="projectId" value={project.id} />
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                name="editorsCanAssignTasks"
                value="true"
                defaultChecked={settings.editorsCanAssignTasks}
                className="mt-1 size-4 accent-blue-munsell-500"
              />
              <span>
                <span className="block font-medium text-sm">Allow editors to assign tasks</span>
                <span className="mt-1 block text-paynes-gray-500 text-sm dark:text-french-gray-400">
                  Board administrators can always manage assignments. Viewers remain read-only.
                </span>
              </span>
            </label>
            <button
              type="submit"
              disabled={updateRules.pending}
              className="mt-5 rounded bg-blue-munsell-500 px-4 py-2 text-white disabled:opacity-60"
            >
              {updateRules.pending ? "Saving…" : "Save board rule"}
            </button>
            <ActionFeedback state={updateRules.state} />
          </form>
        </TechFrameCard>
      )}

      {capabilities.canManageMembers && (
        <TechFrameCard className="w-full" contentClassName={framedSectionContentClass}>
          <h2 className="font-semibold text-lg text-outer-space-500 dark:text-platinum-500">Members</h2>
          <p className="mt-1 text-paynes-gray-500 text-sm dark:text-french-gray-400">
            Invite an active member of this workspace to the board. Workspace outsiders are never available in this
            selector.
          </p>
          <div className="mt-4 rounded-lg border border-blue-munsell-200 bg-blue-munsell-50 p-4 dark:border-blue-munsell-800 dark:bg-blue-munsell-900/20">
            <p className="font-medium text-sm">{workspaceOwner.name}</p>
            <p className="text-paynes-gray-500 text-sm dark:text-french-gray-400">{workspaceOwner.email}</p>
            <p className="mt-1 text-blue-munsell-700 text-xs dark:text-blue-munsell-300">
              {workspaceOwner.explicitProjectMemberId
                ? `Workspace owner · implicit board administrator access · explicit ${boardRoleLabel(workspaceOwner.explicitRole ?? "viewer")} membership`
                : "Workspace owner · implicit board administrator access · add explicitly before assigning tasks"}
            </p>
          </div>
          <form action={inviteMember.action} className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input type="hidden" name="projectId" value={project.id} />
            <select
              name="email"
              required
              defaultValue=""
              aria-label="Workspace member"
              className="min-w-0 flex-1 rounded border border-french-gray-300 bg-white px-3 py-2 dark:border-paynes-gray-400 dark:bg-outer-space-400"
            >
              <option value="" disabled>
                Select a workspace member
              </option>
              {availableWorkspaceMembers.map((member) => (
                <option key={member.id} value={member.email}>
                  {member.name} ({member.email})
                </option>
              ))}
            </select>
            <select
              name="boardRole"
              defaultValue="viewer"
              className="rounded border border-french-gray-300 bg-white px-3 py-2 dark:border-paynes-gray-400 dark:bg-outer-space-400"
            >
              <option value="viewer">Viewer</option>
              <option value="editor">Editor</option>
              <option value="board_admin">Board administrator</option>
            </select>
            <button
              type="submit"
              disabled={inviteMember.pending || availableWorkspaceMembers.length === 0}
              className="rounded bg-blue-munsell-500 px-4 py-2 text-white disabled:opacity-60"
            >
              {inviteMember.pending ? "Sending…" : "Send board invitation"}
            </button>
          </form>
          {availableWorkspaceMembers.length === 0 && (
            <p className="mt-2 text-paynes-gray-500 text-sm dark:text-french-gray-400">
              No additional active workspace members are available for an explicit board membership.
            </p>
          )}
          <ActionFeedback state={inviteMember.state} />

          <div className="mt-6 border-cyan-300/20 border-t pt-5">
            <h3 className="font-semibold text-cyan-50">Board members</h3>
          </div>
          <div className="mt-2 divide-y divide-french-gray-300 dark:divide-paynes-gray-400">
            {members.map((member) => (
              <div key={member.id}>{renderMember(member)}</div>
            ))}
          </div>
        </TechFrameCard>
      )}

      {capabilities.canManageMembers && (
        <PendingProjectInvitations
          invitations={invitations}
          resendInvitation={resendInvitation}
          revokeInvitation={revokeInvitation}
        />
      )}

      {capabilities.canDeleteProject && (
        <TechFrameCard className="w-full" contentClassName={framedSectionContentClass}>
          <h2 className="font-semibold text-lg text-yellow-900 dark:text-yellow-100">Project controls</h2>
          <form action={deleteProject.action} className="mt-4">
            <input type="hidden" name="projectId" value={project.id} />
            <button
              type="submit"
              disabled={deleteProject.pending}
              className="rounded bg-red-600 px-4 py-2 text-white disabled:opacity-60"
            >
              {deleteProject.pending ? "Deleting…" : "Delete project"}
            </button>
            <ActionFeedback state={deleteProject.state} />
            <p className="mt-2 text-sm text-yellow-900 dark:text-yellow-100">
              Deleting a project also deletes its lists, tasks, and memberships.
            </p>
          </form>
        </TechFrameCard>
      )}
    </div>
  )
}
