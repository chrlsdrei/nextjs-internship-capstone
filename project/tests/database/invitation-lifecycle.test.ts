import { randomUUID } from "node:crypto"

import { neon } from "@neondatabase/serverless"
import { eq, inArray, sql } from "drizzle-orm"
import { drizzle } from "drizzle-orm/neon-http"
import { afterEach, describe, expect, it } from "vitest"

import {
  acceptInvitationRecord,
  createInvitationRecord,
  findInvitationByTokenHash,
  revokeInvitationRecord,
  rotateInvitationToken,
} from "../../features/invitations/server/invitation.repository"
import { hashInvitationToken, invitationExpiry } from "../../features/invitations/server/invitation-token"
import * as schema from "../../server/db/schema"
import {
  projectMembers,
  projects,
  users,
  workspaceInvitations,
  workspaceMembers,
  workspaceSettings,
  workspaces,
} from "../../server/db/schema"

const client = neon(process.env.TEST_DATABASE_URL as string)
const database = drizzle({ client, schema })
const createdWorkspaceIds = new Set<string>()
const createdUserIds = new Set<string>()

async function createUser(label: string) {
  const suffix = `${label}-${randomUUID()}`
  const normalizedEmail = `${suffix}@projectflow.test`.toLowerCase()
  const [user] = await database
    .insert(users)
    .values({ clerkId: `user_${suffix}`, email: normalizedEmail, normalizedEmail, name: `Test ${label}` })
    .returning()
  createdUserIds.add(user.id)
  return user
}

async function createWorkspaceFixture(label: string) {
  const owner = await createUser(`${label}-owner`)
  const workspaceId = randomUUID()
  const ownerMemberId = randomUUID()
  await database.batch([
    database.insert(workspaces).values({
      id: workspaceId,
      name: `Workspace ${label}`,
      ownerWorkspaceMemberId: ownerMemberId,
    }),
    database.insert(workspaceMembers).values({ id: ownerMemberId, workspaceId, userId: owner.id, role: "admin" }),
    database.insert(workspaceSettings).values({ workspaceId }),
  ])
  createdWorkspaceIds.add(workspaceId)
  return { owner, workspaceId, ownerMemberId }
}

async function createProjectFixture(workspaceId: string, ownerMemberId: string, label: string) {
  const [project] = await database
    .insert(projects)
    .values({ workspaceId, title: `Project ${label}`, createdByWorkspaceMemberId: ownerMemberId })
    .returning()
  return project
}

async function createInvitationFixture(input: {
  workspaceId: string
  ownerMemberId: string
  email: string
  token: string
  projectId?: string
  kind?: "workspace" | "project"
  expiresAt?: Date
}) {
  return createInvitationRecord({
    kind: input.kind ?? "workspace",
    workspaceId: input.workspaceId,
    projectId: input.projectId ?? null,
    invitedByWorkspaceMemberId: input.ownerMemberId,
    email: input.email,
    normalizedEmail: input.email.toLowerCase(),
    workspaceRole: input.kind === "project" ? null : "member",
    boardRole: input.projectId ? "viewer" : null,
    tokenHash: hashInvitationToken(input.token),
    expiresAt: input.expiresAt ?? invitationExpiry(),
  })
}

afterEach(async () => {
  await database.execute(sql`TRUNCATE TABLE "activity_logs"`)
  if (createdWorkspaceIds.size)
    await database.delete(workspaces).where(inArray(workspaces.id, [...createdWorkspaceIds]))
  if (createdUserIds.size) await database.delete(users).where(inArray(users.id, [...createdUserIds]))
  createdWorkspaceIds.clear()
  createdUserIds.clear()
})

describe("invitation persistence", () => {
  it("atomically accepts a combined invitation once and stores no raw token", async () => {
    const workspace = await createWorkspaceFixture("combined")
    const project = await createProjectFixture(workspace.workspaceId, workspace.ownerMemberId, "combined")
    const recipient = await createUser("combined-recipient")
    const rawToken = `raw-${randomUUID()}-${randomUUID()}`
    const invitation = await createInvitationFixture({
      workspaceId: workspace.workspaceId,
      ownerMemberId: workspace.ownerMemberId,
      email: recipient.normalizedEmail,
      token: rawToken,
      projectId: project.id,
    })
    const attempts = await Promise.all([
      acceptInvitationRecord(hashInvitationToken(rawToken), recipient.id, recipient.normalizedEmail),
      acceptInvitationRecord(hashInvitationToken(rawToken), recipient.id, recipient.normalizedEmail),
    ])
    expect(attempts.filter(Boolean)).toHaveLength(1)

    const [membership] = await database.select().from(workspaceMembers).where(eq(workspaceMembers.userId, recipient.id))
    const [projectMembership] = await database
      .select()
      .from(projectMembers)
      .where(eq(projectMembers.workspaceMemberId, membership.id))
    const [stored] = await database
      .select()
      .from(workspaceInvitations)
      .where(eq(workspaceInvitations.id, invitation?.id as string))
    expect(projectMembership.projectId).toBe(project.id)
    expect(stored.tokenHash).toBe(hashInvitationToken(rawToken))
    expect(JSON.stringify(stored)).not.toContain(rawToken)
  })

  it("rejects expired, revoked, mismatched, and replayed tokens", async () => {
    const workspace = await createWorkspaceFixture("rejections")
    const recipient = await createUser("rejections-recipient")
    const expiredToken = `expired-${randomUUID()}`
    const expired = await createInvitationFixture({
      workspaceId: workspace.workspaceId,
      ownerMemberId: workspace.ownerMemberId,
      email: recipient.normalizedEmail,
      token: expiredToken,
    })
    await database
      .update(workspaceInvitations)
      .set({ createdAt: new Date(Date.now() - 10_000), expiresAt: new Date(Date.now() - 1_000) })
      .where(eq(workspaceInvitations.id, expired?.id as string))
    expect(
      await acceptInvitationRecord(hashInvitationToken(expiredToken), recipient.id, recipient.normalizedEmail),
    ).toBeNull()

    const revokedToken = `revoked-${randomUUID()}`
    const revoked = await createInvitationFixture({
      workspaceId: workspace.workspaceId,
      ownerMemberId: workspace.ownerMemberId,
      email: `revoked-${recipient.normalizedEmail}`,
      token: revokedToken,
    })
    await revokeInvitationRecord(revoked?.id as string, workspace.owner.id)
    expect(
      await acceptInvitationRecord(
        hashInvitationToken(revokedToken),
        recipient.id,
        `revoked-${recipient.normalizedEmail}`,
      ),
    ).toBeNull()

    const mismatchToken = `mismatch-${randomUUID()}`
    await createInvitationFixture({
      workspaceId: workspace.workspaceId,
      ownerMemberId: workspace.ownerMemberId,
      email: `different-${recipient.normalizedEmail}`,
      token: mismatchToken,
    })
    expect(
      await acceptInvitationRecord(hashInvitationToken(mismatchToken), recipient.id, recipient.normalizedEmail),
    ).toBeNull()

    const validRecipient = await createUser("valid-recipient")
    const validToken = `valid-${randomUUID()}`
    await createInvitationFixture({
      workspaceId: workspace.workspaceId,
      ownerMemberId: workspace.ownerMemberId,
      email: validRecipient.normalizedEmail,
      token: validToken,
    })
    expect(
      await acceptInvitationRecord(hashInvitationToken(validToken), validRecipient.id, validRecipient.normalizedEmail),
    ).not.toBeNull()
    expect(
      await acceptInvitationRecord(hashInvitationToken(validToken), validRecipient.id, validRecipient.normalizedEmail),
    ).toBeNull()
  })

  it("requires a project invitee to be an active member of the same workspace", async () => {
    const first = await createWorkspaceFixture("first")
    const second = await createWorkspaceFixture("second")
    const project = await createProjectFixture(first.workspaceId, first.ownerMemberId, "first")
    const recipient = await createUser("cross-workspace")
    await database.insert(workspaceMembers).values({ workspaceId: second.workspaceId, userId: recipient.id })
    await expect(
      createInvitationFixture({
        workspaceId: second.workspaceId,
        ownerMemberId: second.ownerMemberId,
        email: `invalid-${recipient.normalizedEmail}`,
        token: `invalid-${randomUUID()}`,
        projectId: project.id,
        kind: "project",
      }),
    ).rejects.toThrow()
    const token = `project-${randomUUID()}`
    await createInvitationFixture({
      workspaceId: first.workspaceId,
      ownerMemberId: first.ownerMemberId,
      email: recipient.normalizedEmail,
      token,
      projectId: project.id,
      kind: "project",
    })
    expect(await acceptInvitationRecord(hashInvitationToken(token), recipient.id, recipient.normalizedEmail)).toBeNull()
  })

  it("rotates resend tokens and increments the idempotent delivery attempt", async () => {
    const workspace = await createWorkspaceFixture("resend")
    const token = `old-${randomUUID()}`
    const invitation = await createInvitationFixture({
      workspaceId: workspace.workspaceId,
      ownerMemberId: workspace.ownerMemberId,
      email: `resend-${randomUUID()}@projectflow.test`,
      token,
    })
    const replacement = `new-${randomUUID()}`
    const rotated = await rotateInvitationToken(
      invitation?.id as string,
      hashInvitationToken(replacement),
      invitationExpiry(),
    )
    expect(rotated?.deliveryAttempt).toBe(2)
    expect(await findInvitationByTokenHash(hashInvitationToken(token))).toBeNull()
    expect((await findInvitationByTokenHash(hashInvitationToken(replacement)))?.id).toBe(invitation?.id)
  })
})
