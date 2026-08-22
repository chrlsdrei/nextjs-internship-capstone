import { afterEach, describe, expect, it } from "vitest"
import {
  invitationDeliveryIdempotencyKey,
  sendInvitationEmail,
} from "../../features/invitations/gateways/invitation-email.gateway"
import {
  buildInvitationAcceptanceUrl,
  buildInvitationEmail,
} from "../../features/invitations/gateways/invitation-email.template"
import {
  createProjectInvitationSchema,
  createWorkspaceInvitationSchema,
} from "../../features/invitations/invitation.schema"
import {
  createInvitationToken,
  hashInvitationToken,
  invitationExpiry,
} from "../../features/invitations/services/invitation-token"

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
        kind: "workspace",
        workspaceName: "ProjectFlow",
        projectTitle: null,
        workspaceRole: "member",
        boardRole: null,
        token: "secret-token",
        expiresAt: new Date("2026-08-29T00:00:00.000Z"),
      }),
    ).rejects.toMatchObject({ code: "INVITATION_CONFIGURATION", status: 503 })
  })

  it("builds an absolute acceptance URL without trusting a configured path", () => {
    expect(buildInvitationAcceptanceUrl("https://projectflow.example/settings", "a+b&c")).toBe(
      "https://projectflow.example/invitations/accept?token=a%2Bb%26c",
    )
  })

  it("renders escaped workspace and board details in HTML and plain text", () => {
    const email = buildInvitationEmail({
      kind: "workspace",
      workspaceName: "Research <Team>",
      projectTitle: "Launch & Learn",
      workspaceRole: "member",
      boardRole: "editor",
      invitationUrl: "https://projectflow.example/invitations/accept?token=secret",
      expiresAt: new Date("2026-08-29T00:00:00.000Z"),
    })

    expect(email.subject).toContain("Launch & Learn")
    expect(email.text).toContain("Workspace member and Board editor")
    expect(email.text).toContain("single-use invitation")
    expect(email.html).toContain("Research &lt;Team&gt;")
    expect(email.html).toContain("Launch &amp; Learn")
    expect(email.html).not.toContain("Research <Team>")
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
