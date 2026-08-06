import { randomUUID } from "node:crypto"

import { neon } from "@neondatabase/serverless"
import { eq, inArray } from "drizzle-orm"
import { drizzle } from "drizzle-orm/neon-http"
import { afterEach, describe, expect, it } from "vitest"
import { insertList } from "../../features/board/server/list.repository"
import { insertTask } from "../../features/board/server/task.repository"
import { findProjectAccess, softRemoveMemberAndUnassignTasks } from "../../features/members/server/member.repository"
import { insertProject } from "../../features/projects/server/project.repository"
import * as schema from "../../server/db/schema"
import {
  lists,
  projectMembers,
  tasks,
  users,
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
  const email = `${suffix}@projectflow.test`.toLowerCase()
  const [user] = await database
    .insert(users)
    .values({ clerkId: `user_${suffix}`, email, normalizedEmail: email, name: `Test ${label}` })
    .returning()
  createdUserIds.add(user.id)
  return user
}

async function createWorkspace(ownerUserId: string, label: string) {
  const workspaceId = randomUUID()
  const ownerMembershipId = randomUUID()
  await database.batch([
    database
      .insert(workspaces)
      .values({ id: workspaceId, name: `Workspace ${label}`, ownerWorkspaceMemberId: ownerMembershipId }),
    database
      .insert(workspaceMembers)
      .values({ id: ownerMembershipId, workspaceId, userId: ownerUserId, role: "admin" }),
    database.insert(workspaceSettings).values({ workspaceId }),
  ])
  createdWorkspaceIds.add(workspaceId)
  return { workspaceId, ownerMembershipId }
}

async function addWorkspaceMember(workspaceId: string, userId: string, role: "admin" | "member" = "member") {
  const [membership] = await database.insert(workspaceMembers).values({ workspaceId, userId, role }).returning()
  return membership
}

async function createProjectFor(
  workspaceId: string,
  creatorWorkspaceMemberId: string,
  creatorIsWorkspaceOwner: boolean,
  label: string,
) {
  const project = await insertProject(creatorWorkspaceMemberId, creatorIsWorkspaceOwner, {
    workspaceId,
    name: `Project ${label}`,
  })
  if (!project) throw new Error("Expected project creation to succeed")
  return project
}

afterEach(async () => {
  if (createdWorkspaceIds.size > 0) {
    await database.delete(workspaces).where(inArray(workspaces.id, [...createdWorkspaceIds]))
    createdWorkspaceIds.clear()
  }
  if (createdUserIds.size > 0) {
    await database.delete(users).where(inArray(users.id, [...createdUserIds]))
    createdUserIds.clear()
  }
})

describe("project workspace governance", () => {
  it("gives the workspace owner implicit board-admin access without a project membership", async () => {
    const owner = await createUser("implicit-owner")
    const workspace = await createWorkspace(owner.id, "implicit-owner")
    const project = await createProjectFor(workspace.workspaceId, workspace.ownerMembershipId, true, "implicit-owner")

    const access = await findProjectAccess(project.id, owner.id)
    const memberships = await database.select().from(projectMembers).where(eq(projectMembers.projectId, project.id))

    expect(access).toMatchObject({ role: "board_admin", isWorkspaceOwner: true, projectMemberId: null })
    expect(memberships).toHaveLength(0)
  })

  it("does not give workspace administrators implicit project access", async () => {
    const owner = await createUser("admin-owner")
    const administrator = await createUser("workspace-admin")
    const workspace = await createWorkspace(owner.id, "admin-access")
    await addWorkspaceMember(workspace.workspaceId, administrator.id, "admin")
    const project = await createProjectFor(workspace.workspaceId, workspace.ownerMembershipId, true, "admin-access")

    expect(await findProjectAccess(project.id, administrator.id)).toBeNull()
  })

  it("adds a non-owner project creator as an explicit board administrator", async () => {
    const owner = await createUser("creator-owner")
    const creator = await createUser("non-owner-creator")
    const workspace = await createWorkspace(owner.id, "creator")
    const creatorMembership = await addWorkspaceMember(workspace.workspaceId, creator.id, "admin")
    const project = await createProjectFor(workspace.workspaceId, creatorMembership.id, false, "creator")

    const access = await findProjectAccess(project.id, creator.id)
    const [membership] = await database.select().from(projectMembers).where(eq(projectMembers.projectId, project.id))

    expect(access).toMatchObject({ role: "board_admin", isWorkspaceOwner: false })
    expect(membership.workspaceMemberId).toBe(creatorMembership.id)
    expect(membership.role).toBe("board_admin")
  })

  it("rejects project memberships from another workspace", async () => {
    const firstOwner = await createUser("cross-project-first")
    const secondOwner = await createUser("cross-project-second")
    const firstWorkspace = await createWorkspace(firstOwner.id, "cross-project-first")
    const secondWorkspace = await createWorkspace(secondOwner.id, "cross-project-second")
    const project = await createProjectFor(
      firstWorkspace.workspaceId,
      firstWorkspace.ownerMembershipId,
      true,
      "cross-project",
    )

    await expect(
      database.insert(projectMembers).values({
        projectId: project.id,
        workspaceId: firstWorkspace.workspaceId,
        workspaceMemberId: secondWorkspace.ownerMembershipId,
        role: "viewer",
      }),
    ).rejects.toThrow()
  })

  it("requires explicit project membership before assigning the implicit owner", async () => {
    const owner = await createUser("assignment-owner")
    const workspace = await createWorkspace(owner.id, "assignment")
    const project = await createProjectFor(workspace.workspaceId, workspace.ownerMembershipId, true, "assignment")
    const [list] = await database.insert(lists).values({ projectId: project.id, name: "To do" }).returning()

    const withoutMembership = await insertTask(project.id, owner.id, {
      title: "Not assigned",
      listId: list.id,
      assigneeId: owner.id,
      priority: "medium",
      position: 0,
    })
    expect(withoutMembership).toBeNull()

    await database.insert(projectMembers).values({
      projectId: project.id,
      workspaceId: workspace.workspaceId,
      workspaceMemberId: workspace.ownerMembershipId,
      role: "viewer",
    })
    const withMembership = await insertTask(project.id, owner.id, {
      title: "Assigned",
      listId: list.id,
      assigneeId: owner.id,
      priority: "medium",
      position: 0,
    })
    expect(withMembership).not.toBeNull()
  })

  it("rejects a task whose list belongs to another project", async () => {
    const owner = await createUser("task-integrity-owner")
    const workspace = await createWorkspace(owner.id, "task-integrity")
    const firstProject = await createProjectFor(workspace.workspaceId, workspace.ownerMembershipId, true, "task-first")
    const secondProject = await createProjectFor(
      workspace.workspaceId,
      workspace.ownerMembershipId,
      true,
      "task-second",
    )
    const [secondList] = await database
      .insert(lists)
      .values({ projectId: secondProject.id, name: "Second" })
      .returning()

    await expect(
      database.insert(tasks).values({
        projectId: firstProject.id,
        listId: secondList.id,
        title: "Invalid task",
      }),
    ).rejects.toThrow()
  })

  it("enforces board-admin, editor, and viewer write capabilities", async () => {
    const owner = await createUser("role-owner")
    const editor = await createUser("role-editor")
    const viewer = await createUser("role-viewer")
    const workspace = await createWorkspace(owner.id, "roles")
    const editorWorkspaceMember = await addWorkspaceMember(workspace.workspaceId, editor.id)
    const viewerWorkspaceMember = await addWorkspaceMember(workspace.workspaceId, viewer.id)
    const project = await createProjectFor(workspace.workspaceId, workspace.ownerMembershipId, true, "roles")
    await database.insert(projectMembers).values([
      {
        projectId: project.id,
        workspaceId: workspace.workspaceId,
        workspaceMemberId: editorWorkspaceMember.id,
        role: "editor",
      },
      {
        projectId: project.id,
        workspaceId: workspace.workspaceId,
        workspaceMemberId: viewerWorkspaceMember.id,
        role: "viewer",
      },
    ])
    const [list] = await database.insert(lists).values({ projectId: project.id, name: "To do" }).returning()

    expect(await insertList(project.id, editor.id, { name: "Not allowed", position: 0 })).toBeNull()
    expect(
      await insertTask(project.id, editor.id, {
        title: "Editor task",
        listId: list.id,
        priority: "medium",
        position: 0,
      }),
    ).not.toBeNull()
    expect(
      await insertTask(project.id, viewer.id, {
        title: "Viewer task",
        listId: list.id,
        priority: "medium",
        position: 1,
      }),
    ).toBeNull()
  })

  it("soft-removes board access and unassigns legacy task assignments", async () => {
    const owner = await createUser("remove-owner")
    const administrator = await createUser("remove-admin")
    const assignee = await createUser("remove-assignee")
    const workspace = await createWorkspace(owner.id, "remove")
    const administratorWorkspaceMember = await addWorkspaceMember(workspace.workspaceId, administrator.id)
    const assigneeWorkspaceMember = await addWorkspaceMember(workspace.workspaceId, assignee.id)
    const project = await createProjectFor(workspace.workspaceId, administratorWorkspaceMember.id, false, "remove")
    const [assigneeProjectMember] = await database
      .insert(projectMembers)
      .values({
        projectId: project.id,
        workspaceId: workspace.workspaceId,
        workspaceMemberId: assigneeWorkspaceMember.id,
        role: "editor",
      })
      .returning()
    const [list] = await database.insert(lists).values({ projectId: project.id, name: "To do" }).returning()
    const [task] = await database
      .insert(tasks)
      .values({ projectId: project.id, listId: list.id, title: "Assigned", assigneeId: assignee.id })
      .returning()

    await softRemoveMemberAndUnassignTasks(project.id, administrator.id, assigneeProjectMember.id)

    const [removedMembership] = await database
      .select()
      .from(projectMembers)
      .where(eq(projectMembers.id, assigneeProjectMember.id))
    const [unassignedTask] = await database.select().from(tasks).where(eq(tasks.id, task.id))
    expect(removedMembership.removedAt).toBeInstanceOf(Date)
    expect(unassignedTask.assigneeId).toBeNull()
    expect(await findProjectAccess(project.id, assignee.id)).toBeNull()
  })
})
