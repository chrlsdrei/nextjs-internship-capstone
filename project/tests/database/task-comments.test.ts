import { randomUUID } from "node:crypto"

import { neon } from "@neondatabase/serverless"
import { eq, inArray } from "drizzle-orm"
import { drizzle } from "drizzle-orm/neon-http"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { toTaskCommentDto } from "../../features/comments/comment.mapper"
import {
  findTaskCommentRecord,
  insertTaskCommentRecord,
  listTaskCommentRecords,
  softDeleteTaskCommentRecord,
  updateTaskCommentRecord,
} from "../../features/comments/server/comment.repository"
import { insertProject } from "../../features/projects/server/project.repository"
import * as schema from "../../server/db/schema"
import {
  lists,
  projectMembers,
  taskComments,
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

async function createWorkspace(ownerUserId: string) {
  const workspaceId = randomUUID()
  const ownerMembershipId = randomUUID()
  await database.batch([
    database.insert(workspaces).values({
      id: workspaceId,
      name: "Comment workspace",
      ownerWorkspaceMemberId: ownerMembershipId,
    }),
    database
      .insert(workspaceMembers)
      .values({ id: ownerMembershipId, workspaceId, userId: ownerUserId, role: "admin" }),
    database.insert(workspaceSettings).values({ workspaceId }),
  ])
  createdWorkspaceIds.add(workspaceId)
  return { workspaceId, ownerMembershipId }
}

describe("task comment persistence", () => {
  let owner: typeof users.$inferSelect
  let author: typeof users.$inferSelect
  let otherEditor: typeof users.$inferSelect
  let viewer: typeof users.$inferSelect
  let workspace: { workspaceId: string; ownerMembershipId: string }
  let project: typeof schema.projects.$inferSelect
  let task: typeof tasks.$inferSelect
  let authorMember: typeof workspaceMembers.$inferSelect
  let otherEditorMember: typeof workspaceMembers.$inferSelect
  let viewerMember: typeof workspaceMembers.$inferSelect

  beforeEach(async () => {
    owner = await createUser("comment-owner")
    author = await createUser("comment-author")
    otherEditor = await createUser("comment-other-editor")
    viewer = await createUser("comment-viewer")
    workspace = await createWorkspace(owner.id)
    ;[authorMember, otherEditorMember, viewerMember] = await database
      .insert(workspaceMembers)
      .values([
        { workspaceId: workspace.workspaceId, userId: author.id },
        { workspaceId: workspace.workspaceId, userId: otherEditor.id },
        { workspaceId: workspace.workspaceId, userId: viewer.id },
      ])
      .returning()
    const createdProject = await insertProject(workspace.ownerMembershipId, true, {
      workspaceId: workspace.workspaceId,
      title: "Comment project",
    })
    if (!createdProject) throw new Error("Expected project creation")
    project = createdProject
    await database.insert(projectMembers).values([
      {
        workspaceId: workspace.workspaceId,
        projectId: project.id,
        workspaceMemberId: authorMember.id,
        role: "editor",
      },
      {
        workspaceId: workspace.workspaceId,
        projectId: project.id,
        workspaceMemberId: otherEditorMember.id,
        role: "editor",
      },
      {
        workspaceId: workspace.workspaceId,
        projectId: project.id,
        workspaceMemberId: viewerMember.id,
        role: "viewer",
      },
    ])
    const [list] = await database.insert(lists).values({ projectId: project.id, name: "To do" }).returning()
    ;[task] = await database
      .insert(tasks)
      .values({ projectId: project.id, listId: list.id, title: "Discuss implementation" })
      .returning()
  })

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

  async function createComment(content: string, member = authorMember, user = author) {
    const inserted = await insertTaskCommentRecord({
      projectId: project.id,
      taskId: task.id,
      authorWorkspaceMemberId: member.id,
      authorName: user.name,
      authorEmail: user.email,
      content,
    })
    if (!inserted) throw new Error("Expected comment creation")
    return inserted
  }

  it("paginates comments with a deterministic cursor", async () => {
    await createComment("First")
    await createComment("Second")
    await createComment("Third")

    const firstPage = await listTaskCommentRecords({ projectId: project.id, taskId: task.id, limit: 2 })
    expect(firstPage).toHaveLength(3)
    const pageItems = firstPage.slice(0, 2)
    const last = pageItems.at(-1)
    if (!last) throw new Error("Expected a cursor record")
    const secondPage = await listTaskCommentRecords({
      projectId: project.id,
      taskId: task.id,
      limit: 2,
      cursor: { createdAt: last.createdAt, id: last.id },
    })
    expect(secondPage).toHaveLength(1)
  })

  it("allows authors and administrators to mutate while rejecting another editor and viewers", async () => {
    const comment = await createComment("Original")
    expect(
      await updateTaskCommentRecord({
        projectId: project.id,
        taskId: task.id,
        commentId: comment.id,
        actorWorkspaceMemberId: otherEditorMember.id,
        canMutateOwn: true,
        canModerate: false,
        content: "Unauthorized",
      }),
    ).toBeNull()
    expect(
      await updateTaskCommentRecord({
        projectId: project.id,
        taskId: task.id,
        commentId: comment.id,
        actorWorkspaceMemberId: workspace.ownerMembershipId,
        canMutateOwn: true,
        canModerate: true,
        content: "Moderated",
      }),
    ).not.toBeNull()

    const viewerComment = await createComment("Viewer historical comment", viewerMember, viewer)
    expect(
      await updateTaskCommentRecord({
        projectId: project.id,
        taskId: task.id,
        commentId: viewerComment.id,
        actorWorkspaceMemberId: viewerMember.id,
        canMutateOwn: false,
        canModerate: false,
        content: "Viewer edit",
      }),
    ).toBeNull()
  })

  it("soft-deletes to a tombstone while retaining stored content and authorship", async () => {
    const comment = await createComment("Preserved content")
    expect(
      await softDeleteTaskCommentRecord({
        projectId: project.id,
        taskId: task.id,
        commentId: comment.id,
        actorWorkspaceMemberId: authorMember.id,
        canMutateOwn: true,
        canModerate: false,
      }),
    ).not.toBeNull()
    const stored = await findTaskCommentRecord(project.id, task.id, comment.id)
    if (!stored) throw new Error("Expected stored comment")
    expect(stored.content).toBe("Preserved content")
    expect(stored.deletedAt).toBeInstanceOf(Date)
    expect(toTaskCommentDto(stored, { role: "editor", workspaceMemberId: authorMember.id }).content).toBeNull()
  })

  it("keeps removed authors' comments readable through identity snapshots", async () => {
    const comment = await createComment("Historical context")
    await database
      .update(workspaceMembers)
      .set({ removedAt: new Date() })
      .where(eq(workspaceMembers.id, authorMember.id))
    const stored = await findTaskCommentRecord(project.id, task.id, comment.id)
    expect(stored).toMatchObject({ authorName: author.name, authorEmail: author.email, authorRemoved: true })
  })

  it("rejects task and project combinations from different projects", async () => {
    const otherProject = await insertProject(workspace.ownerMembershipId, true, {
      workspaceId: workspace.workspaceId,
      title: "Other project",
    })
    if (!otherProject) throw new Error("Expected other project")
    await expect(
      database.insert(taskComments).values({
        workspaceId: workspace.workspaceId,
        projectId: otherProject.id,
        taskId: task.id,
        authorWorkspaceMemberId: authorMember.id,
        authorName: author.name,
        authorEmail: author.email,
        content: "Invalid",
      }),
    ).rejects.toThrow()
  })
})
