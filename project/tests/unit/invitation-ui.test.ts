import { describe, expect, it } from "vitest"

import { invitationDisplayState } from "../../features/invitations/invitation.presenter"
import type { InvitationDto } from "../../features/invitations/invitation.types"
import {
  authenticationHref,
  invitationReturnPath,
  safeInvitationRedirect,
} from "../../features/invitations/invitation-redirect"

const activeInvitation: InvitationDto = {
  id: "invitation-id",
  kind: "workspace",
  workspaceId: "workspace-id",
  workspaceName: "ProjectFlow",
  projectId: null,
  projectTitle: null,
  email: "member@example.com",
  workspaceRole: "member",
  boardRole: null,
  deliveryStatus: "sent",
  expiresAt: "2030-01-08T00:00:00.000Z",
  acceptedAt: null,
  revokedAt: null,
  createdAt: "2030-01-01T00:00:00.000Z",
}

describe("invitation UI state", () => {
  it("distinguishes active, expired, revoked, accepted, and failed delivery states", () => {
    const now = new Date("2030-01-02T00:00:00.000Z")
    expect(invitationDisplayState(activeInvitation, now).key).toBe("active")
    expect(invitationDisplayState({ ...activeInvitation, expiresAt: "2030-01-01T00:00:00.000Z" }, now).key).toBe(
      "expired",
    )
    expect(invitationDisplayState({ ...activeInvitation, revokedAt: now.toISOString() }, now).key).toBe("revoked")
    expect(invitationDisplayState({ ...activeInvitation, acceptedAt: now.toISOString() }, now).key).toBe("accepted")
    expect(invitationDisplayState({ ...activeInvitation, deliveryStatus: "failed" }, now).key).toBe("failed")
  })
})

describe("invitation authentication return paths", () => {
  it("round-trips the invitation token through sign-in and sign-up URLs", () => {
    const returnPath = invitationReturnPath("token with symbols/+?")
    const signIn = authenticationHref("/sign-in", returnPath)
    const encodedReturnPath = new URL(signIn, "https://projectflow.local").searchParams.get("redirect_url")
    expect(safeInvitationRedirect(encodedReturnPath ?? undefined)).toBe(returnPath)
  })

  it("rejects external, protocol-relative, and unrelated redirect targets", () => {
    expect(safeInvitationRedirect("https://example.com/invitations/accept?token=secret")).toBeUndefined()
    expect(safeInvitationRedirect("//example.com/invitations/accept?token=secret")).toBeUndefined()
    expect(safeInvitationRedirect("/dashboard")).toBeUndefined()
    expect(safeInvitationRedirect("/invitations/accept")).toBeUndefined()
  })
})
