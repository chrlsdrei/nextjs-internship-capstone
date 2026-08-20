import { CheckCircle2, Clock3, MailWarning, ShieldX } from "lucide-react"
import Link from "next/link"

import { ActionFeedback } from "@/components/ui/action-feedback"
import type { InvitationAcceptanceDto, InvitationPreviewDto } from "@/features/invitations/invitation.types"
import type { ActionState } from "@/lib/action-state"

type AcceptController = {
  action: (payload: FormData) => void
  pending: boolean
  state: ActionState<InvitationAcceptanceDto>
}

type InvitationAcceptViewProps = {
  preview: InvitationPreviewDto
  token: string
  signedIn: boolean
  signInHref: string
  signUpHref: string
  accept: AcceptController
}

const stateCopy = {
  invalid: {
    icon: ShieldX,
    title: "Invitation not found",
    message: "This invitation link is invalid. Ask the sender for a new invitation.",
  },
  expired: {
    icon: Clock3,
    title: "Invitation expired",
    message: "This invitation has expired. Ask a workspace administrator or board administrator to resend it.",
  },
  revoked: {
    icon: ShieldX,
    title: "Invitation revoked",
    message: "This invitation is no longer active. Contact the sender if you still need access.",
  },
  accepted: {
    icon: CheckCircle2,
    title: "Invitation already accepted",
    message: "This invitation has already been used. Open ProjectFlow to continue.",
  },
} as const

export function InvitationAcceptView({
  preview,
  token,
  signedIn,
  signInHref,
  signUpHref,
  accept,
}: InvitationAcceptViewProps) {
  if (preview.state !== "active") {
    const copy = stateCopy[preview.state]
    const Icon = copy.icon
    return (
      <InvitationCard>
        <Icon className="mx-auto size-10 text-blue-munsell-500" aria-hidden="true" />
        <h1 className="mt-4 font-bold text-2xl text-outer-space-500 dark:text-platinum-500">{copy.title}</h1>
        <p className="mt-2 text-paynes-gray-500 dark:text-french-gray-400">{copy.message}</p>
        <Link href="/" className="mt-6 inline-flex rounded-lg bg-blue-munsell-500 px-4 py-2 font-medium text-white">
          Return to ProjectFlow
        </Link>
      </InvitationCard>
    )
  }

  const destination = preview.projectTitle
    ? `${preview.workspaceName} · ${preview.projectTitle}`
    : preview.workspaceName
  const mismatch = accept.state.status === "error" && accept.state.code === "INVITATION_EMAIL_MISMATCH"

  return (
    <InvitationCard>
      <MailWarning className="mx-auto size-10 text-blue-munsell-500" aria-hidden="true" />
      <p className="mt-4 font-medium text-blue-munsell-700 text-sm dark:text-blue-munsell-300">
        ProjectFlow invitation
      </p>
      <h1 className="mt-2 font-bold text-2xl text-outer-space-500 dark:text-platinum-500">Join {destination}</h1>
      <p className="mt-3 text-paynes-gray-500 dark:text-french-gray-400">
        Continue with the verified Clerk account matching <strong>{preview.maskedEmail}</strong>.
      </p>
      {preview.expiresAt && (
        <p className="mt-2 text-paynes-gray-500 text-sm dark:text-french-gray-400">
          Expires{" "}
          {new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(
            new Date(preview.expiresAt),
          )}
        </p>
      )}

      {signedIn ? (
        <form action={accept.action} className="mt-6">
          <input type="hidden" name="token" value={token} />
          <button
            type="submit"
            disabled={accept.pending}
            className="w-full rounded-lg bg-blue-munsell-500 px-4 py-2.5 font-medium text-white disabled:opacity-60"
          >
            {accept.pending ? "Accepting…" : "Accept invitation"}
          </button>
          {mismatch && (
            <p className="mt-3 rounded-lg border border-red-300 bg-red-50 p-3 text-left text-red-700 text-sm dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">
              You are signed in with a different account. Sign out, then return to this link and use the invited email
              address.
            </p>
          )}
          {!mismatch && <ActionFeedback state={accept.state} />}
        </form>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link href={signInHref} className="rounded-lg bg-blue-munsell-500 px-4 py-2.5 font-medium text-white">
            Sign in to accept
          </Link>
          <Link
            href={signUpHref}
            className="rounded-lg border border-blue-munsell-500 px-4 py-2.5 font-medium text-blue-munsell-700 dark:text-blue-munsell-300"
          >
            Create account
          </Link>
        </div>
      )}
    </InvitationCard>
  )
}

function InvitationCard({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-platinum-900 px-4 py-12 dark:bg-outer-space-600">
      <section className="w-full max-w-lg rounded-2xl border border-french-gray-300 bg-white p-8 text-center shadow-xl dark:border-paynes-gray-400 dark:bg-outer-space-500">
        {children}
      </section>
    </main>
  )
}
