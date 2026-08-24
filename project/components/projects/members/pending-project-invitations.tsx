import { ActionFeedback } from "@/components/ui/action-feedback"
import { OrnamentalFrame } from "@/components/ui/ornamental-frame"
import { invitationDisplayState, isPendingInvitation } from "@/features/invitations/invitation.presenter"
import type { InvitationDto } from "@/features/invitations/invitation.types"
import { boardRoleLabel } from "@/features/projects/project.policy"
import type { ActionState } from "@/lib/action-state"

type FormController = {
  action: (payload: FormData) => void
  pending: boolean
  state: ActionState
}

type PendingProjectInvitationsProps = {
  invitations: InvitationDto[]
  resendInvitation: FormController
  revokeInvitation: FormController
}

export function PendingProjectInvitations({
  invitations,
  resendInvitation,
  revokeInvitation,
}: PendingProjectInvitationsProps) {
  const pendingInvitations = invitations.filter((invitation) => isPendingInvitation(invitation))

  return (
    <OrnamentalFrame
      title="Pending invitations"
      className="w-full"
      contentClassName="min-w-0 px-6 pb-8 pt-2 sm:px-12 lg:px-16"
    >
      <p className="mb-4 text-cyan-100/65 text-sm">Board invitations that are still waiting for a response.</p>

      {pendingInvitations.length === 0 ? (
        <div className="rounded-lg border border-cyan-300/20 bg-blue-950/35 p-5 text-center text-cyan-100/65 text-sm">
          No pending board invitations.
        </div>
      ) : (
        <div className="divide-y divide-cyan-300/20 rounded-lg border border-cyan-300/20 bg-blue-950/35 px-4">
          {pendingInvitations.map((invitation) => {
            const display = invitationDisplayState(invitation)
            return (
              <div
                key={invitation.id}
                className="flex min-w-0 flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-cyan-50" title={invitation.email}>
                    {invitation.email}
                  </p>
                  <p className="mt-1 text-cyan-100/60 text-xs">
                    {invitation.boardRole ? boardRoleLabel(invitation.boardRole) : "Board access"} · {display.label}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <form action={resendInvitation.action}>
                    <input type="hidden" name="invitationId" value={invitation.id} />
                    <button
                      type="submit"
                      disabled={resendInvitation.pending || revokeInvitation.pending}
                      className="rounded-lg border border-cyan-300/40 px-3 py-1.5 text-cyan-100 text-sm hover:bg-cyan-300/10 disabled:opacity-60"
                    >
                      {resendInvitation.pending ? "Resending…" : "Resend"}
                    </button>
                  </form>
                  <form action={revokeInvitation.action}>
                    <input type="hidden" name="invitationId" value={invitation.id} />
                    <button
                      type="submit"
                      disabled={resendInvitation.pending || revokeInvitation.pending}
                      className="rounded-lg border border-red-400/55 px-3 py-1.5 text-red-300 text-sm hover:bg-red-400/10 disabled:opacity-60"
                    >
                      {revokeInvitation.pending ? "Revoking…" : "Revoke"}
                    </button>
                  </form>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <ActionFeedback state={resendInvitation.state} />
      <ActionFeedback state={revokeInvitation.state} />
    </OrnamentalFrame>
  )
}
