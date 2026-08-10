import { ActionFeedback } from "@/components/ui/action-feedback"
import { invitationDisplayState } from "@/features/invitations/invitation.presenter"
import { MemberRowController } from "@/features/members/controllers/member-row.controller"
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
  inviteOutsider: FormController
  resendInvitation: FormController
  revokeInvitation: FormController
  deleteProject: FormController
  updateProject: FormController
  updateRules: FormController
}

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
  inviteOutsider,
  resendInvitation,
  revokeInvitation,
  deleteProject,
  updateProject,
  updateRules,
}: ProjectMemberManagerProps) {
  const dateValue = project.dueDate?.slice(0, 10) ?? ""

  return (
    <div className="space-y-6">
      {capabilities.canManageDetails && (
        <section className="rounded-lg border border-french-gray-300 bg-white p-6 dark:border-paynes-gray-400 dark:bg-outer-space-500">
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
        </section>
      )}

      {capabilities.canManageBoardRules && (
        <section className="rounded-lg border border-french-gray-300 bg-white p-6 dark:border-paynes-gray-400 dark:bg-outer-space-500">
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
        </section>
      )}

      {capabilities.canManageMembers && (
        <section className="rounded-lg border border-french-gray-300 bg-white p-6 dark:border-paynes-gray-400 dark:bg-outer-space-500">
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

          {workspace.canInviteNewMembers && (
            <div className="mt-6 rounded-lg border border-french-gray-300 p-4 dark:border-paynes-gray-400">
              <h3 className="font-medium">Invite someone new</h3>
              <p className="mt-1 text-paynes-gray-500 text-sm dark:text-french-gray-400">
                Workspace owners and administrators may invite a new user to both the workspace and this board.
              </p>
              <form
                action={inviteOutsider.action}
                className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto_auto]"
              >
                <input type="hidden" name="workspaceId" value={workspace.id} />
                <input type="hidden" name="projectId" value={project.id} />
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="name@example.com"
                  aria-label="New member email"
                  className="min-w-0 rounded border border-french-gray-300 bg-white px-3 py-2 dark:border-paynes-gray-400 dark:bg-outer-space-400"
                />
                <select
                  name="workspaceRole"
                  defaultValue="member"
                  aria-label="Workspace role"
                  className="rounded border border-french-gray-300 bg-white px-3 py-2 dark:border-paynes-gray-400 dark:bg-outer-space-400"
                >
                  <option value="member">Workspace member</option>
                  <option value="admin">Workspace administrator</option>
                </select>
                <select
                  name="boardRole"
                  defaultValue="viewer"
                  aria-label="Board role"
                  className="rounded border border-french-gray-300 bg-white px-3 py-2 dark:border-paynes-gray-400 dark:bg-outer-space-400"
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                  <option value="board_admin">Board administrator</option>
                </select>
                <button
                  type="submit"
                  disabled={inviteOutsider.pending}
                  className="rounded bg-blue-munsell-500 px-4 py-2 text-white disabled:opacity-60"
                >
                  {inviteOutsider.pending ? "Sending…" : "Invite"}
                </button>
              </form>
              <ActionFeedback state={inviteOutsider.state} />
            </div>
          )}

          {invitations.length > 0 && (
            <div className="mt-6 border-french-gray-300 border-t pt-5 dark:border-paynes-gray-400">
              <h3 className="font-medium">Pending and previous invitations</h3>
              <div className="mt-3 divide-y divide-french-gray-300 dark:divide-paynes-gray-400">
                {invitations.map((invitation) => {
                  const display = invitationDisplayState(invitation)
                  const manageable = !invitation.acceptedAt && !invitation.revokedAt
                  return (
                    <div
                      key={invitation.id}
                      className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="text-sm">{invitation.email}</p>
                        <p className="text-paynes-gray-500 text-xs dark:text-french-gray-400">
                          {invitation.boardRole ? boardRoleLabel(invitation.boardRole) : "Board access"} ·{" "}
                          {display.label}
                        </p>
                      </div>
                      {manageable && (
                        <div className="flex gap-2">
                          <form action={resendInvitation.action}>
                            <input type="hidden" name="invitationId" value={invitation.id} />
                            <button
                              type="submit"
                              disabled={resendInvitation.pending}
                              className="rounded border px-3 py-1 text-sm"
                            >
                              Resend
                            </button>
                          </form>
                          <form action={revokeInvitation.action}>
                            <input type="hidden" name="invitationId" value={invitation.id} />
                            <button
                              type="submit"
                              disabled={revokeInvitation.pending}
                              className="rounded border border-red-500 px-3 py-1 text-red-600 text-sm"
                            >
                              Revoke
                            </button>
                          </form>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              <ActionFeedback state={resendInvitation.state} />
              <ActionFeedback state={revokeInvitation.state} />
            </div>
          )}
          <div className="mt-5 divide-y divide-french-gray-300 dark:divide-paynes-gray-400">
            {members.map((member) => (
              <MemberRowController key={member.id} projectId={project.id} member={member} />
            ))}
          </div>
        </section>
      )}

      {capabilities.canDeleteProject && (
        <section className="rounded-lg border border-yellow-300 bg-yellow-50 p-6 dark:border-yellow-800 dark:bg-yellow-900/20">
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
        </section>
      )}
    </div>
  )
}
