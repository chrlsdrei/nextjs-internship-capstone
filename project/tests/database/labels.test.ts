import { randomUUID } from "node:crypto"

import { neon } from "@neondatabase/serverless"
import { eq, inArray, sql } from "drizzle-orm"
import { drizzle } from "drizzle-orm/neon-http"
import { afterEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({ currentDatabaseUser: vi.fn() }))

vi.mock("@/features/auth/server/session.service", () => ({
  getCurrentDatabaseUser: mocks.currentDatabaseUser,
}))

import { createTask, getProjectBoard, updateTask } from "../../features/board/server/board.service"
import type { LabelError } from "../../features/labels/label.error"
import { createLabel, deleteLabel, setTaskLabels, updateLabel } from "../../features/labels/server/label.service"
import { ProjectAccessError } from "../../features/projects/server/project-access.service"
import * as schema from "../../server/db/schema"
import {
  activityLogs,
  labels,
  lists,
  projectMembers,
  projectSettings,
  projects,
  taskLabels,
  tasks,
  users,
  workspaceMembers,
  workspaceSettings,
  workspaces,
} from "../../server/db/schema"

const client = neon(process.env.TEST_DATABASE_URL as string)
const database = drizzle({ client, schema })
const workspaceIds = new Set<string>()
const userIds = new Set<string>()

async function createUser(label: string) {
  const id = randomUUID()
  const email = `${label}-${id}@projectflow.test`
  const [user] = await database
    .insert(users)
    .values({ id, clerkId: `user_${id}`, email, normalizedEmail: email, name: `User ${label}` })
    .returning()
  userIds.add(id)
  return user
}

async function fixture() {
  const owner = await createUser("label-owner")
  const editor = await createUser("label-editor")
  const viewer = await createUser("label-viewer")
  const workspaceId = randomUUID()
  const ownerMemberId = randomUUID()
  const editorMemberId = randomUUID()
  const viewerMemberId = randomUUID()
  const firstProjectId = randomUUID()
  const secondProjectId = randomUUID()
  const firstListId = randomUUID()
  const secondListId = randomUUID()
  const firstTaskId = randomUUID()
  const secondTaskId = randomUUID()

  await database.batch([
    database.insert(workspaces).values({
      id: workspaceId,
      name: "Label workspace",
      ownerWorkspaceMemberId: ownerMemberId,
    }),
    database.insert(workspaceMembers).values([
      { id: ownerMemberId, workspaceId, userId: owner.id, role: "admin" },
      { id: editorMemberId, workspaceId, userId: editor.id, role: "member" },
      { id: viewerMemberId, workspaceId, userId: viewer.id, role: "member" },
    ]),
    database.insert(workspaceSettings).values({ workspaceId }),
    database.insert(projects).values([
      {
        id: firstProjectId,
        workspaceId,
        title: "First project",
        createdByWorkspaceMemberId: ownerMemberId,
      },
      {
        id: secondProjectId,
        workspaceId,
        title: "Second project",
        createdByWorkspaceMemberId: ownerMemberId,
      },
    ]),
    database.insert(projectSettings).values([{ projectId: firstProjectId }, { projectId: secondProjectId }]),
    database.insert(projectMembers).values([
      { workspaceId, projectId: firstProjectId, workspaceMemberId: editorMemberId, role: "editor" },
      { workspaceId, projectId: firstProjectId, workspaceMemberId: viewerMemberId, role: "viewer" },
    ]),
    database.insert(lists).values([
      { id: firstListId, projectId: firstProjectId, name: "First list" },
      { id: secondListId, projectId: secondProjectId, name: "Second list" },
    ]),
    database.insert(tasks).values([
      { id: firstTaskId, projectId: firstProjectId, listId: firstListId, title: "First task" },
      { id: secondTaskId, projectId: secondProjectId, listId: secondListId, title: "Second task" },
    ]),
  ])
  workspaceIds.add(workspaceId)
  return {
    owner,
    editor,
    viewer,
    workspaceId,
    firstProjectId,
    secondProjectId,
    firstListId,
    firstTaskId,
    secondTaskId,
  }
}

afterEach(async () => {
  await database.execute(sql`TRUNCATE TABLE "activity_logs"`)
  if (workspaceIds.size) await database.delete(workspaces).where(inArray(workspaces.id, [...workspaceIds]))
  if (userIds.size) await database.delete(users).where(inArray(users.id, [...userIds]))
  workspaceIds.clear()
  userIds.clear()
  vi.clearAllMocks()
})

describe("project labels", () => {
  it("normalizes project-local names while permitting the same name in another project", async () => {
    const data = await fixture()
    mocks.currentDatabaseUser.mockResolvedValue(data.owner)
    const first = await createLabel(data.firstProjectId, { name: "  Needs   Review ", color: "#AABBCC" })
    expect(first).toMatchObject({ name: "Needs Review", color: "#aabbcc" })
    await expect(createLabel(data.firstProjectId, { name: "needs review", color: "#112233" })).rejects.toMatchObject({
      code: "DUPLICATE_LABEL",
    } satisfies Partial<LabelError>)
    await expect(createLabel(data.secondProjectId, { name: "NEEDS REVIEW", color: "#112233" })).resolves.toMatchObject({
      name: "NEEDS REVIEW",
    })
  })

  it("allows editors to assign existing labels but prevents viewer and cross-project mutations", async () => {
    const data = await fixture()
    mocks.currentDatabaseUser.mockResolvedValue(data.owner)
    const label = await createLabel(data.firstProjectId, { name: "Priority", color: "#ff0000" })

    mocks.currentDatabaseUser.mockResolvedValue(data.editor)
    await expect(
      setTaskLabels({ projectId: data.firstProjectId, taskId: data.firstTaskId, labelIds: [label.id] }),
    ).resolves.toHaveLength(1)
    const board = await getProjectBoard(data.firstProjectId)
    expect(board.labels).toEqual(expect.arrayContaining([expect.objectContaining({ id: label.id })]))
    expect(board.lists[0]?.tasks[0]?.labels).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: label.id })]),
    )
    await expect(createLabel(data.firstProjectId, { name: "Editor label", color: "#000000" })).rejects.toBeInstanceOf(
      ProjectAccessError,
    )

    mocks.currentDatabaseUser.mockResolvedValue(data.viewer)
    await expect(
      setTaskLabels({ projectId: data.firstProjectId, taskId: data.firstTaskId, labelIds: [] }),
    ).rejects.toBeInstanceOf(ProjectAccessError)
    await expect(createLabel(data.firstProjectId, { name: "Viewer label", color: "#000000" })).rejects.toBeInstanceOf(
      ProjectAccessError,
    )

    await expect(
      database.insert(taskLabels).values({
        projectId: data.firstProjectId,
        taskId: data.secondTaskId,
        labelId: label.id,
      }),
    ).rejects.toMatchObject({ cause: { code: "23503" } })
  })

  it("records palette and assignment activity and cascades deleted label assignments", async () => {
    const data = await fixture()
    mocks.currentDatabaseUser.mockResolvedValue(data.owner)
    const label = await createLabel(data.firstProjectId, { name: "Backend", color: "#123456" })
    const updated = await updateLabel(data.firstProjectId, label.id, { name: "API", color: "#654321" })
    await setTaskLabels({ projectId: data.firstProjectId, taskId: data.firstTaskId, labelIds: [updated.id] })
    await deleteLabel(data.firstProjectId, updated.id)

    expect(await database.select().from(taskLabels).where(eq(taskLabels.taskId, data.firstTaskId))).toHaveLength(0)
    const actions = (
      await database
        .select({ action: activityLogs.action })
        .from(activityLogs)
        .where(eq(activityLogs.projectId, data.firstProjectId))
    ).map((activity) => activity.action)
    expect(actions).toEqual(
      expect.arrayContaining(["label.created", "label.updated", "task.labels_updated", "label.deleted"]),
    )
    expect(await database.select().from(labels).where(eq(labels.projectId, data.firstProjectId))).toHaveLength(0)

    const projectLabelsTable = await database.execute<{ name: string | null }>(
      sql`SELECT to_regclass('public.project_labels')::text AS "name"`,
    )
    expect(projectLabelsTable.rows[0]?.name).toBeNull()
  })

  it("validates and persists labels through task create and update mutations", async () => {
    const data = await fixture()
    mocks.currentDatabaseUser.mockResolvedValue(data.owner)
    const label = await createLabel(data.firstProjectId, { name: "Frontend", color: "#3366ff" })
    const foreignLabel = await createLabel(data.secondProjectId, { name: "Foreign", color: "#ff6633" })

    mocks.currentDatabaseUser.mockResolvedValue(data.editor)
    const task = await createTask(data.firstProjectId, {
      listId: data.firstListId,
      title: "Labeled during creation",
      labelIds: [label.id],
    })
    expect(task).toBeTruthy()
    expect(
      (await getProjectBoard(data.firstProjectId)).lists
        .flatMap((list) => list.tasks)
        .find((item) => item.id === task.id)?.labels,
    ).toEqual(expect.arrayContaining([expect.objectContaining({ id: label.id })]))

    await updateTask(data.firstProjectId, task.id, { labelIds: [] })
    expect(await database.select().from(taskLabels).where(eq(taskLabels.taskId, task.id))).toHaveLength(0)
    await expect(
      createTask(data.firstProjectId, {
        listId: data.firstListId,
        title: "Cross-project label",
        labelIds: [foreignLabel.id],
      }),
    ).rejects.toBeInstanceOf(ProjectAccessError)
  })
})
