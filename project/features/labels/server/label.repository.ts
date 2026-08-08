import "server-only"

import { and, asc, eq, inArray, ne, sql } from "drizzle-orm"

import type { CreateLabelInput, SetTaskLabelsInput, UpdateLabelInput } from "@/features/labels/label.schema"
import { db } from "@/server/db/client"
import { labels, tasks } from "@/server/db/schema"

export async function listProjectLabelRecords(projectId: string) {
  return db.select().from(labels).where(eq(labels.projectId, projectId)).orderBy(asc(labels.name), asc(labels.id))
}

export async function findProjectLabelRecord(projectId: string, labelId: string) {
  const rows = await db
    .select()
    .from(labels)
    .where(and(eq(labels.projectId, projectId), eq(labels.id, labelId)))
    .limit(1)
  return rows[0] ?? null
}

export async function findDuplicateLabelRecord(projectId: string, normalizedName: string, exceptId?: string) {
  const rows = await db
    .select({ id: labels.id })
    .from(labels)
    .where(
      and(
        eq(labels.projectId, projectId),
        eq(labels.normalizedName, normalizedName),
        exceptId ? ne(labels.id, exceptId) : undefined,
      ),
    )
    .limit(1)
  return rows[0] ?? null
}

export async function insertLabelRecord(
  projectId: string,
  createdByWorkspaceMemberId: string,
  values: CreateLabelInput,
) {
  const rows = await db
    .insert(labels)
    .values({ projectId, createdByWorkspaceMemberId, ...values })
    .onConflictDoNothing({ target: [labels.projectId, labels.normalizedName] })
    .returning()
  return rows[0] ?? null
}

export async function updateLabelRecord(projectId: string, labelId: string, values: UpdateLabelInput) {
  const rows = await db
    .update(labels)
    .set(values)
    .where(and(eq(labels.projectId, projectId), eq(labels.id, labelId)))
    .returning()
  return rows[0] ?? null
}

export async function deleteLabelRecord(projectId: string, labelId: string) {
  const rows = await db
    .delete(labels)
    .where(and(eq(labels.projectId, projectId), eq(labels.id, labelId)))
    .returning()
  return rows[0] ?? null
}

export async function findTaskLabelContext(projectId: string, taskId: string, labelIds: string[]) {
  const [taskRows, labelRows] = await Promise.all([
    db
      .select({ id: tasks.id, title: tasks.title })
      .from(tasks)
      .where(and(eq(tasks.projectId, projectId), eq(tasks.id, taskId)))
      .limit(1),
    labelIds.length
      ? db
          .select({ id: labels.id, name: labels.name })
          .from(labels)
          .where(and(eq(labels.projectId, projectId), inArray(labels.id, labelIds)))
      : Promise.resolve([]),
  ])
  return { task: taskRows[0] ?? null, labels: labelRows }
}

export async function replaceTaskLabelRecords(values: SetTaskLabelsInput, actorWorkspaceMemberId: string) {
  const ids = JSON.stringify(values.labelIds)
  const result = await db.execute<{ valid: boolean }>(sql`
    WITH "requested" AS (
      SELECT DISTINCT "value"::uuid AS "id"
      FROM jsonb_array_elements_text(${ids}::jsonb)
    ), "valid_request" AS (
      SELECT "task"."id"
      FROM "tasks" AS "task"
      WHERE "task"."id" = ${values.taskId}
        AND "task"."project_id" = ${values.projectId}
        AND (SELECT COUNT(*) FROM "requested") = (
          SELECT COUNT(*) FROM "labels" AS "label"
          INNER JOIN "requested" ON "requested"."id" = "label"."id"
          WHERE "label"."project_id" = ${values.projectId}
        )
    ), "deleted" AS (
      DELETE FROM "task_labels" AS "task_label"
      WHERE "task_label"."task_id" = ${values.taskId}
        AND "task_label"."project_id" = ${values.projectId}
        AND EXISTS (SELECT 1 FROM "valid_request")
        AND NOT EXISTS (SELECT 1 FROM "requested" WHERE "requested"."id" = "task_label"."label_id")
      RETURNING "task_label"."label_id"
    ), "inserted" AS (
      INSERT INTO "task_labels" ("project_id", "task_id", "label_id", "added_by_workspace_member_id")
      SELECT ${values.projectId}, ${values.taskId}, "requested"."id", ${actorWorkspaceMemberId}
      FROM "requested"
      WHERE EXISTS (SELECT 1 FROM "valid_request")
      ON CONFLICT ("task_id", "label_id") DO NOTHING
      RETURNING "label_id"
    )
    SELECT EXISTS(SELECT 1 FROM "valid_request") AS "valid",
      (SELECT COUNT(*) FROM "deleted") AS "deleted_count",
      (SELECT COUNT(*) FROM "inserted") AS "inserted_count"
  `)
  return result.rows[0]?.valid ?? false
}
