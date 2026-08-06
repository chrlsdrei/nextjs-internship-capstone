import { auth } from "@clerk/nextjs/server"
import { InvitationAcceptController } from "@/features/invitations/controllers/invitation-accept.controller"
import { authenticationHref, invitationReturnPath } from "@/features/invitations/invitation-redirect"
import { getInvitationPreview } from "@/features/invitations/server/invitation.service"

export default async function AcceptInvitationPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>
}) {
  const rawToken = (await searchParams).token
  const token = Array.isArray(rawToken) ? (rawToken[0] ?? "") : (rawToken ?? "")
  const [preview, session] = await Promise.all([getInvitationPreview(token), auth()])
  const returnPath = invitationReturnPath(token)

  return (
    <InvitationAcceptController
      preview={preview}
      token={token}
      signedIn={Boolean(session.userId)}
      signInHref={authenticationHref("/sign-in", returnPath)}
      signUpHref={authenticationHref("/sign-up", returnPath)}
    />
  )
}
