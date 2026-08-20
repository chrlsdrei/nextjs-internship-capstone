import "server-only"

import { and, countDistinct, eq, gte, inArray, lt, sql } from "drizzle-orm"

import { db } from "@/server/db/client"
import { activityLogs, lists, projects, tasks } from "@/server/db/schema"

const completedListSql = sql`lower(trim(${lists.name})) IN ('done', 'complete', 'completed', 'finished')`
const completedMoveSql = sql`lower(trim(${activityLogs.metadata}->>'targetListName')) IN ('done', 'complete', 'completed', 'finished')`

export async function readProjectProgress(projectIds: string[]) {
  if (projectIds.length === 0) return []

  return db
    .select({
      id: projects.id,
      title: projects.title,
      totalTasks: sql<number>`count(${tasks.id})`.mapWith(Number),
      completedTasks: sql<number>`count(${tasks.id}) filter (where ${completedListSql})`.mapWith(Number),
    })
    .from(projects)
    .leftJoin(lists, eq(lists.projectId, projects.id))
    .leftJoin(tasks, and(eq(tasks.projectId, projects.id), eq(tasks.listId, lists.id)))
    .where(inArray(projects.id, projectIds))
    .groupBy(projects.id, projects.title)
    .orderBy(projects.title)
}

export async function readCompletionContributions(projectIds: string[], startsAt: Date, endsAt: Date) {
  if (projectIds.length === 0) return []
  const localDate = sql`timezone('Asia/Manila', ${activityLogs.createdAt})::date`

  return db
    .select({
      date: sql<string>`to_char(${localDate}, 'YYYY-MM-DD')`,
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(activityLogs)
    .where(
      and(
        inArray(activityLogs.projectId, projectIds),
        eq(activityLogs.action, "task.moved"),
        gte(activityLogs.createdAt, startsAt),
        lt(activityLogs.createdAt, endsAt),
        completedMoveSql,
      ),
    )
    .groupBy(localDate)
    .orderBy(localDate)
}

export async function readRecentActivity(projectIds: string[], startsAt: Date) {
  if (projectIds.length === 0) return []
  const localDate = sql`timezone('Asia/Manila', ${activityLogs.createdAt})::date`

  return db
    .select({
      date: sql<string>`to_char(${localDate}, 'YYYY-MM-DD')`,
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(activityLogs)
    .where(and(inArray(activityLogs.projectId, projectIds), gte(activityLogs.createdAt, startsAt)))
    .groupBy(localDate)
    .orderBy(localDate)
}

export async function countRecentContributors(projectIds: string[], startsAt: Date) {
  if (projectIds.length === 0) return 0

  const [result] = await db
    .select({ count: countDistinct(activityLogs.actorWorkspaceMemberId) })
    .from(activityLogs)
    .where(
      and(
        inArray(activityLogs.projectId, projectIds),
        gte(activityLogs.createdAt, startsAt),
        sql`${activityLogs.actorWorkspaceMemberId} IS NOT NULL`,
      ),
    )
  return result?.count ?? 0
}
