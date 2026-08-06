import { Mail, RefreshCw, ShieldCheck, UserMinus } from "lucide-react"

import { ActionFeedback } from "@/components/ui/action-feedback"
import { invitationDisplayState } from "@/features/invitations/invitation.presenter"
import type { InvitationDto } from "@/features/invitations/invitation.types"
import type { WorkspaceDetailDto } from "@/features/workspaces/workspace.types"
import type { ActionState } from "@/lib/action-state"

import { WorkspaceRoleBadge } from "./workspace-role-badge"

type FormController = {
  action: (payload: FormData) => void
  pending: boolean
  state: ActionState
}

type WorkspaceMembersProps = {
  workspace: WorkspaceDetailDto
  invitations: InvitationDto[]
  createInvitation: FormController
  resendInvitation: FormController
  revokeInvitation: FormController
  updateRole: FormController
  removeMember: FormController
  transferOwnership: FormController
}

export function WorkspaceMembers({
  workspace,
  invitations,
  createInvitation,
  resendInvitation,
  revokeInvitation,
  updateRole,
  removeMember,
  transferOwnership,
}: WorkspaceMembersProps) {
  return (
    <div className="space-y-6">
      {workspace.capabilities.canInviteWorkspaceMembers && (
        <section className="rounded-xl border border-french-gray-300 bg-white p-6 dark:border-paynes-gray-400 dark:bg-outer-space-500">
          <h2 className="font-semibold text-lg text-outer-space-500 dark:text-platinum-500">
            Invite a workspace member
          </h2>
          <p className="mt-1 text-paynes-gray-500 text-sm dark:text-french-gray-400">
            Send a seven-day, single-use invitation. The recipient must accept it with the verified Clerk email shown
            here.
          </p>
          <form action={createInvitation.action} className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
            <input type="hidden" name="workspaceId" value={workspace.id} />
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="name@example.com"
              aria-label="Recipient email"
              className="min-w-0 rounded-lg border border-french-gray-300 bg-white px-3 py-2 dark:border-paynes-gray-400 dark:bg-outer-space-400"
            />
            <select
              name="workspaceRole"
              defaultValue="member"
              aria-label="Workspace role"
              className="rounded-lg border border-french-gray-300 bg-white px-3 py-2 dark:border-paynes-gray-400 dark:bg-outer-space-400"
            >
              <option value="member">Member</option>
              <option value="admin">Administrator</option>
            </select>
            <button
              type="submit"
              disabled={createInvitation.pending}
              className="rounded-lg bg-blue-munsell-500 px-4 py-2 font-medium text-white disabled:opacity-60"
            >
              {createInvitation.pending ? "Sending…" : "Send invitation"}
            </button>
          </form>
          <ActionFeedback state={createInvitation.state} />
        </section>
      )}

      <section className="rounded-xl border border-french-gray-300 bg-white p-6 dark:border-paynes-gray-400 dark:bg-outer-space-500">
        <h2 className="font-semibold text-lg text-outer-space-500 dark:text-platinum-500">Workspace members</h2>
        <p className="mt-1 text-paynes-gray-500 text-sm dark:text-french-gray-400">
          Roles and ownership controls appear only when your workspace capabilities allow them.
        </p>
        <div className="mt-5 divide-y divide-french-gray-300 dark:divide-paynes-gray-400">
          {workspace.members.map((member) => (
            <article
              key={member.id}
              className="flex flex-col gap-4 py-4 lg:flex-row lg:items-center lg:justify-between"
            >
              <div className="min-w-0">
                <p className="font-medium text-outer-space-500 dark:text-platinum-500">{member.name}</p>
                <p className="mt-1 inline-flex items-center gap-2 truncate text-paynes-gray-500 text-sm dark:text-french-gray-400">
                  <Mail size={14} /> {member.email}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <WorkspaceRoleBadge role={member.role} />
                {member.capabilities.canChangeRole && (
                  <form action={updateRole.action} className="flex items-center gap-2">
                    <input type="hidden" name="workspaceId" value={workspace.id} />
                    <input type="hidden" name="memberId" value={member.id} />
                    <select
                      name="role"
                      defaultValue={member.role}
                      aria-label={`Role for ${member.name}`}
                      className="rounded border border-french-gray-300 bg-white px-2 py-1.5 text-sm dark:border-paynes-gray-400 dark:bg-outer-space-400"
                    >
                      <option value="member">Member</option>
                      <option value="admin">Administrator</option>
                    </select>
                    <button type="submit" disabled={updateRole.pending} className="rounded border px-3 py-1.5 text-sm">
                      Save
                    </button>
                  </form>
                )}
                {member.capabilities.canReceiveOwnership && (
                  <form action={transferOwnership.action}>
                    <input type="hidden" name="workspaceId" value={workspace.id} />
                    <input type="hidden" name="newOwnerMemberId" value={member.id} />
                    <button
                      type="submit"
                      disabled={transferOwnership.pending}
                      className="inline-flex items-center gap-1 rounded border border-blue-munsell-500 px-3 py-1.5 text-blue-munsell-700 text-sm dark:text-blue-munsell-300"
                    >
                      <ShieldCheck size={14} /> Transfer ownership
                    </button>
                  </form>
                )}
                {member.capabilities.canRemove && (
                  <form action={removeMember.action}>
                    <input type="hidden" name="workspaceId" value={workspace.id} />
                    <input type="hidden" name="memberId" value={member.id} />
                    <button
                      type="submit"
                      disabled={removeMember.pending}
                      className="inline-flex items-center gap-1 rounded border border-red-500 px-3 py-1.5 text-red-600 text-sm"
                    >
                      <UserMinus size={14} /> Remove
                    </button>
                  </form>
                )}
              </div>
            </article>
          ))}
        </div>
        <ActionFeedback state={updateRole.state} />
        <ActionFeedback state={transferOwnership.state} />
        <ActionFeedback state={removeMember.state} />
      </section>

      {workspace.capabilities.canInviteWorkspaceMembers && (
        <section className="rounded-xl border border-french-gray-300 bg-white p-6 dark:border-paynes-gray-400 dark:bg-outer-space-500">
          <h2 className="font-semibold text-lg text-outer-space-500 dark:text-platinum-500">Invitation history</h2>
          <div className="mt-4 divide-y divide-french-gray-300 dark:divide-paynes-gray-400">
            {invitations.length === 0 && (
              <p className="py-4 text-paynes-gray-500 text-sm dark:text-french-gray-400">No invitations yet.</p>
            )}
            {invitations.map((invitation) => {
              const display = invitationDisplayState(invitation)
              const manageable = !invitation.acceptedAt && !invitation.revokedAt
              return (
                <article
                  key={invitation.id}
                  className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium">{invitation.email}</p>
                    <p className="mt-1 text-paynes-gray-500 text-sm dark:text-french-gray-400">
                      {invitation.workspaceRole === "admin" ? "Administrator" : "Member"} · {display.label}
                    </p>
                  </div>
                  {manageable && (
                    <div className="flex gap-2">
                      <form action={resendInvitation.action}>
                        <input type="hidden" name="invitationId" value={invitation.id} />
                        <button
                          type="submit"
                          disabled={resendInvitation.pending}
                          className="inline-flex items-center gap-1 rounded border px-3 py-1.5 text-sm"
                        >
                          <RefreshCw size={14} /> Resend
                        </button>
                      </form>
                      <form action={revokeInvitation.action}>
                        <input type="hidden" name="invitationId" value={invitation.id} />
                        <button
                          type="submit"
                          disabled={revokeInvitation.pending}
                          className="rounded border border-red-500 px-3 py-1.5 text-red-600 text-sm"
                        >
                          Revoke
                        </button>
                      </form>
                    </div>
                  )}
                </article>
              )
            })}
          </div>
          <ActionFeedback state={resendInvitation.state} />
          <ActionFeedback state={revokeInvitation.state} />
        </section>
      )}
    </div>
  )
}
