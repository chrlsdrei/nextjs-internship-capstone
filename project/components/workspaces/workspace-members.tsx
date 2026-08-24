import { Mail, RefreshCw, ShieldCheck, UserMinus } from "lucide-react"

import { ActionFeedback } from "@/components/ui/action-feedback"
import { OrnamentalFrame } from "@/components/ui/ornamental-frame"
import { TaskFrame } from "@/components/ui/task-frame"
import { TechFrameCard } from "@/components/ui/tech-frame-card"
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

const framedSectionContentClass =
  "min-h-0 gap-0 px-[clamp(2.5rem,5vw,6rem)] py-6 sm:min-h-0 sm:px-[clamp(2.5rem,5vw,6rem)] sm:py-8"

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
        <TechFrameCard className="w-full" contentClassName={framedSectionContentClass}>
          <h2 className="font-semibold text-cyan-50 text-lg">Invite a workspace member</h2>
          <p className="mt-1 text-cyan-100/65 text-sm">
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
              className="min-w-0 rounded-lg border border-cyan-300/30 bg-blue-950/65 px-3 py-2 text-white placeholder:text-cyan-100/40 focus:outline-none focus:ring-2 focus:ring-cyan-300/40"
            />
            <select
              name="workspaceRole"
              defaultValue="member"
              aria-label="Workspace role"
              className="rounded-lg border border-cyan-300/30 bg-blue-950/65 px-3 py-2 text-white [color-scheme:dark] focus:outline-none focus:ring-2 focus:ring-cyan-300/40 [&>option]:bg-[#081b31]"
            >
              <option value="member">Member</option>
              <option value="admin">Administrator</option>
            </select>
            <button
              type="submit"
              disabled={createInvitation.pending}
              className="rounded-lg bg-cyan-500 px-4 py-2 font-medium text-blue-950 hover:bg-cyan-300 disabled:opacity-60"
            >
              {createInvitation.pending ? "Sending…" : "Send invitation"}
            </button>
          </form>
          <ActionFeedback state={createInvitation.state} />
        </TechFrameCard>
      )}

      <TechFrameCard className="w-full" contentClassName={framedSectionContentClass}>
        <h2 className="font-semibold text-cyan-50 text-lg">Workspace members</h2>
        <p className="mt-1 text-cyan-100/65 text-sm">
          Roles and ownership controls appear only when your workspace capabilities allow them.
        </p>
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          {workspace.members.map((member) => (
            <TaskFrame key={member.id} contentClassName="flex h-full flex-col gap-4 p-5">
              <article className="flex h-full flex-col gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-white">{member.name}</p>
                  <p className="mt-1 inline-flex max-w-full items-center gap-2 truncate text-cyan-100/65 text-sm">
                    <Mail className="shrink-0" size={14} /> {member.email}
                  </p>
                </div>
                <div className="mt-auto flex flex-wrap items-center gap-2">
                  <WorkspaceRoleBadge role={member.role} />
                  {member.capabilities.canChangeRole && (
                    <form action={updateRole.action} className="flex flex-wrap items-center gap-2">
                      <input type="hidden" name="workspaceId" value={workspace.id} />
                      <input type="hidden" name="memberId" value={member.id} />
                      <select
                        name="role"
                        defaultValue={member.role}
                        aria-label={`Role for ${member.name}`}
                        className="rounded border border-cyan-300/30 bg-blue-950/65 px-2 py-1.5 text-white text-sm [color-scheme:dark] [&>option]:bg-[#081b31]"
                      >
                        <option value="member">Member</option>
                        <option value="admin">Administrator</option>
                      </select>
                      <button
                        type="submit"
                        disabled={updateRole.pending}
                        className="rounded border border-cyan-300/35 px-3 py-1.5 text-cyan-100 text-sm hover:bg-cyan-300/10"
                      >
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
                        className="inline-flex items-center gap-1 rounded border border-cyan-300/40 px-3 py-1.5 text-cyan-100 text-sm hover:bg-cyan-300/10"
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
                        className="inline-flex items-center gap-1 rounded border border-red-400/55 px-3 py-1.5 text-red-300 text-sm hover:bg-red-400/10"
                      >
                        <UserMinus size={14} /> Remove
                      </button>
                    </form>
                  )}
                </div>
              </article>
            </TaskFrame>
          ))}
        </div>
        <ActionFeedback state={updateRole.state} />
        <ActionFeedback state={transferOwnership.state} />
        <ActionFeedback state={removeMember.state} />
      </TechFrameCard>

      {workspace.capabilities.canInviteWorkspaceMembers && (
        <OrnamentalFrame
          title="Invitation history"
          className="w-full"
          contentClassName="min-w-0 px-6 pb-8 pt-2 sm:px-12 lg:px-16"
        >
          <div className="divide-y divide-cyan-300/20 rounded-lg border border-cyan-300/20 bg-blue-950/35 px-4">
            {invitations.length === 0 && <p className="py-4 text-cyan-100/65 text-sm">No invitations yet.</p>}
            {invitations.map((invitation) => {
              const display = invitationDisplayState(invitation)
              const manageable = !invitation.acceptedAt && !invitation.revokedAt && !invitation.declinedAt
              return (
                <article
                  key={invitation.id}
                  className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium">{invitation.email}</p>
                    <p className="mt-1 text-cyan-100/60 text-sm">
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
                          className="inline-flex items-center gap-1 rounded border border-cyan-300/35 px-3 py-1.5 text-cyan-100 text-sm hover:bg-cyan-300/10"
                        >
                          <RefreshCw size={14} /> Resend
                        </button>
                      </form>
                      <form action={revokeInvitation.action}>
                        <input type="hidden" name="invitationId" value={invitation.id} />
                        <button
                          type="submit"
                          disabled={revokeInvitation.pending}
                          className="rounded border border-red-400/55 px-3 py-1.5 text-red-300 text-sm hover:bg-red-400/10"
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
        </OrnamentalFrame>
      )}
    </div>
  )
}
