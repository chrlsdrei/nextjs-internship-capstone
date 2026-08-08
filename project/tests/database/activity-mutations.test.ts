import { randomUUID } from "node:crypto"

import { neon } from "@neondatabase/serverless"
import { eq, inArray, sql } from "drizzle-orm"
import { drizzle } from "drizzle-orm/neon-http"
import { afterEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  currentDatabaseUser: vi.fn(),
  sendInvitationEmail: vi.fn().mockResolvedValue("resend-message-id"),
}))

vi.mock("@/features/auth/server/session.service", () => ({
  getCurrentDatabaseUser: mocks.currentDatabaseUser,
  getVerifiedPrimaryEmail: vi.fn(),
}))

vi.mock("@/features/invitations/server/invitation-email.gateway", () => ({
  sendInvitationEmail: mocks.sendInvitationEmail,
}))

import { listProjectActivity } from "../../features/activity/server/activity.service"
import { createList, createTask } from "../../features/board/server/board.service"
import { createProjectInvitation } from "../../features/invitations/server/invitation.service"
import { addProjectMember } from "../../features/members/server/member.service"
import { createProject } from "../../features/projects/server/project.service"
import { createWorkspace } from "../../features/workspaces/server/workspace.service"
import * as schema from "../../server/db/schema"
import { activityLogs, users, workspaceMembers, workspaces } from "../../server/db/schema"

const client = neon(process.env.TEST_DATABASE_URL as string)
const database = drizzle({ client, schema })
const createdWorkspaceIds = new Set<string>()
const createdUserIds = new Set<string>()

async function createUser(label: string) {
  const id = randomUUID()
  const email = `${label}-${id}@projectflow.test`
  const [user] = await database
    .insert(users)
    .values({ id, clerkId: `user_${id}`, email, normalizedEmail: email, name: `Test ${label}` })
    .returning()
  createdUserIds.add(id)
  return user
}

afterEach(async () => {
  await database.execute(sql`TRUNCATE TABLE "activity_logs"`)
  if (createdWorkspaceIds.size)
    await database.delete(workspaces).where(inArray(workspaces.id, [...createdWorkspaceIds]))
  if (createdUserIds.size) await database.delete(users).where(inArray(users.id, [...createdUserIds]))
  createdWorkspaceIds.clear()
  createdUserIds.clear()
  vi.clearAllMocks()
})

describe("activity-enabled mutations", () => {
  it("records workspace, project, board, membership, and invitation events", async () => {
    const owner = await createUser("activity-owner")
    mocks.currentDatabaseUser.mockResolvedValue(owner)

    const workspace = await createWorkspace({ name: "Activity workspace" })
    createdWorkspaceIds.add(workspace.id)
    const project = await createProject({ workspaceId: workspace.id, title: "Activity project" })
    const list = await createList(project.id, { name: "To do" })
    await createTask(project.id, { listId: list.id, title: "Tracked task", priority: "medium" })

    const projectMemberUser = await createUser("activity-project-member")
    await database.insert(workspaceMembers).values({ workspaceId: workspace.id, userId: projectMemberUser.id })
    await addProjectMember(project.id, { email: projectMemberUser.normalizedEmail, role: "viewer" })

    const invitee = await createUser("activity-invitee")
    await database.insert(workspaceMembers).values({ workspaceId: workspace.id, userId: invitee.id })
    await createProjectInvitation({ projectId: project.id, email: invitee.normalizedEmail, boardRole: "editor" })

    const actions = (
      await database
        .select({ action: activityLogs.action })
        .from(activityLogs)
        .where(eq(activityLogs.workspaceId, workspace.id))
    ).map((activity) => activity.action)
    expect(actions).toEqual(
      expect.arrayContaining([
        "workspace.created",
        "project.created",
        "list.created",
        "task.created",
        "project.member_added",
        "invitation.created",
      ]),
    )
    expect(mocks.sendInvitationEmail).toHaveBeenCalledOnce()

    const platformAdmin = await createUser("platform-admin")
    await database.update(users).set({ systemRole: "super_admin" }).where(eq(users.id, platformAdmin.id))
    mocks.currentDatabaseUser.mockResolvedValue(platformAdmin)
    await expect(listProjectActivity({ projectId: project.id })).rejects.toThrow(/permission/)
  })
})
