import { afterEach, describe, expect, it } from "vitest"

import {
  createProjectInvitationSchema,
  createWorkspaceInvitationSchema,
} from "../../features/invitations/invitation.schema"
import {
  invitationDeliveryIdempotencyKey,
  sendInvitationEmail,
} from "../../features/invitations/server/invitation-email.gateway"
import {
  createInvitationToken,
  hashInvitationToken,
  invitationExpiry,
} from "../../features/invitations/server/invitation-token"

const originalEnvironment = {
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
}

afterEach(() => {
  for (const [key, value] of Object.entries(originalEnvironment)) {
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
})

describe("invitation contracts", () => {
  it("generates high-entropy tokens and stores deterministic hashes", () => {
    const first = createInvitationToken()
    const second = createInvitationToken()
    expect(first).not.toBe(second)
    expect(first.length).toBeGreaterThanOrEqual(40)
    expect(hashInvitationToken(first)).toMatch(/^[a-f0-9]{64}$/)
    expect(hashInvitationToken(first)).not.toContain(first)
    expect(invitationExpiry().getTime()).toBeGreaterThan(Date.now())
  })

  it("requires combined invitations to provide both project and board role", () => {
    expect(
      createWorkspaceInvitationSchema.safeParse({
        workspaceId: "0a8d93bb-5b19-41f6-8357-112b434c6ce7",
        email: "Member@Example.com",
        projectId: "c6e0f983-fb1e-4363-8c1b-4f32f5773313",
      }).success,
    ).toBe(false)
    expect(
      createProjectInvitationSchema.parse({
        projectId: "c6e0f983-fb1e-4363-8c1b-4f32f5773313",
        email: "member@example.com",
      }).boardRole,
    ).toBe("viewer")
  })

  it("reports missing Resend configuration without attempting delivery", async () => {
    delete process.env.RESEND_API_KEY
    delete process.env.RESEND_FROM_EMAIL
    delete process.env.NEXT_PUBLIC_APP_URL
    await expect(
      sendInvitationEmail({
        invitationId: "invitation-id",
        deliveryAttempt: 1,
        recipient: "member@example.com",
        workspaceName: "ProjectFlow",
        projectTitle: null,
        token: "secret-token",
      }),
    ).rejects.toMatchObject({ code: "INVITATION_CONFIGURATION", status: 503 })
  })

  it("uses a stable provider idempotency key for the same delivery attempt", () => {
    expect(invitationDeliveryIdempotencyKey("invitation-id", 3)).toBe(
      invitationDeliveryIdempotencyKey("invitation-id", 3),
    )
    expect(invitationDeliveryIdempotencyKey("invitation-id", 3)).not.toBe(
      invitationDeliveryIdempotencyKey("invitation-id", 4),
    )
  })
})
