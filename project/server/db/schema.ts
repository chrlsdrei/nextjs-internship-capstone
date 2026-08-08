import { relations, sql } from "drizzle-orm"
import {
  type AnyPgColumn,
  boolean,
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core"

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
}

export const taskPriority = pgEnum("task_priority", ["low", "medium", "high"])
export const boardRole = pgEnum("board_role", ["board_admin", "editor", "viewer"])
export const systemRole = pgEnum("system_role", ["user", "super_admin"])
export const accountStatus = pgEnum("account_status", ["active", "suspended", "deleted"])
export const workspaceStatus = pgEnum("workspace_status", ["active", "suspended", "deleted"])
export const workspaceMemberRole = pgEnum("workspace_member_role", ["admin", "member"])
export const rateLimitScope = pgEnum("rate_limit_scope", ["actor", "workspace"])
export const invitationKind = pgEnum("invitation_kind", ["workspace", "project"])
export const invitationDeliveryStatus = pgEnum("invitation_delivery_status", ["pending", "sent", "failed"])

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clerkId: text("clerk_id").notNull(),
    email: text("email").notNull(),
    normalizedEmail: text("normalized_email").notNull(),
    name: text("name").notNull(),
    systemRole: systemRole("system_role").default("user").notNull(),
    accountStatus: accountStatus("account_status").default("active").notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("users_clerk_id_unique").on(table.clerkId),
    uniqueIndex("users_email_unique").on(table.email),
    uniqueIndex("users_normalized_email_unique").on(table.normalizedEmail),
  ],
)

export const workspaces = pgTable(
  "workspaces",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    status: workspaceStatus("status").default("active").notNull(),
    ownerWorkspaceMemberId: uuid("owner_workspace_member_id").notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    foreignKey({
      columns: [table.ownerWorkspaceMemberId, table.id],
      foreignColumns: [workspaceMembers.id, workspaceMembers.workspaceId],
      name: "workspaces_owner_membership_fk",
    }),
    index("workspaces_owner_workspace_member_id_idx").on(table.ownerWorkspaceMemberId),
    index("workspaces_status_idx").on(table.status),
  ],
)

export const workspaceMembers = pgTable(
  "workspace_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references((): AnyPgColumn => workspaces.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    role: workspaceMemberRole("role").default("member").notNull(),
    joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow().notNull(),
    removedAt: timestamp("removed_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    unique("workspace_members_id_workspace_unique").on(table.id, table.workspaceId),
    uniqueIndex("workspace_members_active_user_workspace_unique")
      .on(table.workspaceId, table.userId)
      .where(sql`${table.removedAt} is null`),
    index("workspace_members_workspace_id_idx").on(table.workspaceId),
    index("workspace_members_user_id_idx").on(table.userId),
  ],
)

export const workspaceSettings = pgTable("workspace_settings", {
  workspaceId: uuid("workspace_id")
    .primaryKey()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  membersCanCreateProjects: boolean("members_can_create_projects").default(false).notNull(),
  ...timestamps,
})

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    createdByWorkspaceMemberId: uuid("created_by_workspace_member_id").notNull(),
    dueDate: timestamp("due_date", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    unique("projects_id_workspace_unique").on(table.id, table.workspaceId),
    foreignKey({
      columns: [table.createdByWorkspaceMemberId, table.workspaceId],
      foreignColumns: [workspaceMembers.id, workspaceMembers.workspaceId],
      name: "projects_creator_workspace_member_fk",
    }).onDelete("restrict"),
    index("projects_workspace_id_idx").on(table.workspaceId),
    index("projects_created_by_workspace_member_id_idx").on(table.createdByWorkspaceMemberId),
  ],
)

export const projectSettings = pgTable("project_settings", {
  projectId: uuid("project_id")
    .primaryKey()
    .references(() => projects.id, { onDelete: "cascade" }),
  editorsCanAssignTasks: boolean("editors_can_assign_tasks").default(true).notNull(),
  ...timestamps,
})

export const projectMembers = pgTable(
  "project_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id").notNull(),
    projectId: uuid("project_id").notNull(),
    workspaceMemberId: uuid("workspace_member_id").notNull(),
    role: boardRole("role").default("viewer").notNull(),
    joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow().notNull(),
    removedAt: timestamp("removed_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    unique("project_members_id_project_unique").on(table.id, table.projectId),
    foreignKey({
      columns: [table.projectId, table.workspaceId],
      foreignColumns: [projects.id, projects.workspaceId],
      name: "project_members_project_workspace_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.workspaceMemberId, table.workspaceId],
      foreignColumns: [workspaceMembers.id, workspaceMembers.workspaceId],
      name: "project_members_workspace_member_fk",
    }).onDelete("cascade"),
    uniqueIndex("project_members_active_workspace_member_unique")
      .on(table.projectId, table.workspaceMemberId)
      .where(sql`${table.removedAt} is null`),
    index("project_members_project_id_idx").on(table.projectId),
    index("project_members_workspace_member_id_idx").on(table.workspaceMemberId),
    index("project_members_workspace_id_idx").on(table.workspaceId),
  ],
)

export const lists = pgTable(
  "lists",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    position: integer("position").default(0).notNull(),
    ...timestamps,
  },
  (table) => [
    unique("lists_id_project_unique").on(table.id, table.projectId),
    index("lists_project_position_idx").on(table.projectId, table.position),
    check("lists_position_nonnegative", sql`${table.position} >= 0`),
  ],
)

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    description: text("description"),
    projectId: uuid("project_id").notNull(),
    listId: uuid("list_id").notNull(),
    assigneeId: uuid("assignee_id").references(() => users.id, { onDelete: "set null" }),
    priority: taskPriority("priority").default("medium").notNull(),
    dueDate: timestamp("due_date", { withTimezone: true }),
    position: integer("position").default(0).notNull(),
    ...timestamps,
  },
  (table) => [
    unique("tasks_id_project_unique").on(table.id, table.projectId),
    foreignKey({
      columns: [table.listId, table.projectId],
      foreignColumns: [lists.id, lists.projectId],
      name: "tasks_list_project_fk",
    }).onDelete("cascade"),
    index("tasks_project_id_idx").on(table.projectId),
    index("tasks_list_position_idx").on(table.listId, table.position),
    index("tasks_assignee_id_idx").on(table.assigneeId),
    check("tasks_position_nonnegative", sql`${table.position} >= 0`),
  ],
)

export const labels = pgTable(
  "labels",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    normalizedName: text("normalized_name").notNull(),
    color: text("color").notNull(),
    createdByWorkspaceMemberId: uuid("created_by_workspace_member_id").references(() => workspaceMembers.id, {
      onDelete: "set null",
    }),
    ...timestamps,
  },
  (table) => [
    unique("labels_id_project_unique").on(table.id, table.projectId),
    uniqueIndex("labels_project_normalized_name_unique").on(table.projectId, table.normalizedName),
    index("labels_project_name_idx").on(table.projectId, table.name),
    index("labels_creator_workspace_member_idx").on(table.createdByWorkspaceMemberId),
    check("labels_name_nonempty", sql`length(btrim(${table.name})) > 0`),
    check(
      "labels_normalized_name_valid",
      sql`${table.normalizedName} = lower(regexp_replace(btrim(${table.name}), '\\s+', ' ', 'g'))`,
    ),
    check("labels_color_hex", sql`${table.color} ~ '^#[0-9A-Fa-f]{6}$'`),
  ],
)

export const taskLabels = pgTable(
  "task_labels",
  {
    projectId: uuid("project_id").notNull(),
    taskId: uuid("task_id").notNull(),
    labelId: uuid("label_id").notNull(),
    addedByWorkspaceMemberId: uuid("added_by_workspace_member_id").references(() => workspaceMembers.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.taskId, table.labelId], name: "task_labels_task_label_pk" }),
    foreignKey({
      columns: [table.taskId, table.projectId],
      foreignColumns: [tasks.id, tasks.projectId],
      name: "task_labels_task_project_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.labelId, table.projectId],
      foreignColumns: [labels.id, labels.projectId],
      name: "task_labels_label_project_fk",
    }).onDelete("cascade"),
    index("task_labels_project_label_idx").on(table.projectId, table.labelId),
    index("task_labels_actor_idx").on(table.addedByWorkspaceMemberId),
  ],
)

export const comments = pgTable(
  "comments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    content: text("content").notNull(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (table) => [
    index("comments_task_created_at_idx").on(table.taskId, table.createdAt),
    index("comments_author_id_idx").on(table.authorId),
  ],
)

export const rateLimitBuckets = pgTable(
  "rate_limit_buckets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    scope: rateLimitScope("scope").notNull(),
    scopeKey: uuid("scope_key").notNull(),
    actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "cascade" }),
    workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }),
    action: text("action").notNull(),
    windowStartedAt: timestamp("window_started_at", { withTimezone: true }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    requestCount: integer("request_count").default(1).notNull(),
    ...timestamps,
  },
  (table) => [
    unique("rate_limit_buckets_scope_window_unique").on(
      table.scope,
      table.scopeKey,
      table.action,
      table.windowStartedAt,
    ),
    index("rate_limit_buckets_actor_action_idx").on(table.actorUserId, table.action),
    index("rate_limit_buckets_workspace_action_idx").on(table.workspaceId, table.action),
    index("rate_limit_buckets_expires_at_idx").on(table.expiresAt),
    check("rate_limit_buckets_count_positive", sql`${table.requestCount} > 0`),
    check("rate_limit_buckets_window_valid", sql`${table.expiresAt} > ${table.windowStartedAt}`),
    check(
      "rate_limit_buckets_scope_reference_valid",
      sql`(
        (${table.scope} = 'actor' AND ${table.actorUserId} = ${table.scopeKey} AND ${table.workspaceId} IS NULL)
        OR
        (${table.scope} = 'workspace' AND ${table.workspaceId} = ${table.scopeKey} AND ${table.actorUserId} IS NULL)
      )`,
    ),
  ],
)

export const aiUsageLogs = pgTable(
  "ai_usage_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    projectId: uuid("project_id"),
    quotaKey: text("quota_key").notNull(),
    action: text("action").notNull(),
    model: text("model"),
    tokensUsed: integer("tokens_used").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.projectId, table.workspaceId],
      foreignColumns: [projects.id, projects.workspaceId],
      name: "ai_usage_logs_project_workspace_fk",
    }).onDelete("cascade"),
    index("ai_usage_logs_workspace_quota_created_idx").on(table.workspaceId, table.quotaKey, table.createdAt),
    index("ai_usage_logs_user_created_idx").on(table.userId, table.createdAt),
    index("ai_usage_logs_project_created_idx").on(table.projectId, table.createdAt),
    check("ai_usage_logs_tokens_nonnegative", sql`${table.tokensUsed} >= 0`),
  ],
)

export const workspaceInvitations = pgTable(
  "workspace_invitations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    kind: invitationKind("kind").notNull(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    projectId: uuid("project_id"),
    invitedByWorkspaceMemberId: uuid("invited_by_workspace_member_id").notNull(),
    email: text("email").notNull(),
    normalizedEmail: text("normalized_email").notNull(),
    workspaceRole: workspaceMemberRole("workspace_role"),
    boardRole: boardRole("board_role"),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    acceptedByUserId: uuid("accepted_by_user_id").references(() => users.id, { onDelete: "set null" }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    revokedByUserId: uuid("revoked_by_user_id").references(() => users.id, { onDelete: "set null" }),
    deliveryStatus: invitationDeliveryStatus("delivery_status").default("pending").notNull(),
    deliveryAttempt: integer("delivery_attempt").default(1).notNull(),
    resendMessageId: text("resend_message_id"),
    deliveryErrorCode: text("delivery_error_code"),
    lastSentAt: timestamp("last_sent_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    foreignKey({
      columns: [table.projectId, table.workspaceId],
      foreignColumns: [projects.id, projects.workspaceId],
      name: "workspace_invitations_project_workspace_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.invitedByWorkspaceMemberId, table.workspaceId],
      foreignColumns: [workspaceMembers.id, workspaceMembers.workspaceId],
      name: "workspace_invitations_inviter_workspace_fk",
    }).onDelete("cascade"),
    uniqueIndex("workspace_invitations_token_hash_unique").on(table.tokenHash),
    uniqueIndex("workspace_invitations_active_workspace_email_unique")
      .on(table.workspaceId, table.normalizedEmail)
      .where(sql`${table.kind} = 'workspace' AND ${table.acceptedAt} IS NULL AND ${table.revokedAt} IS NULL`),
    uniqueIndex("workspace_invitations_active_project_email_unique")
      .on(table.projectId, table.normalizedEmail)
      .where(sql`${table.kind} = 'project' AND ${table.acceptedAt} IS NULL AND ${table.revokedAt} IS NULL`),
    index("workspace_invitations_workspace_created_idx").on(table.workspaceId, table.createdAt),
    index("workspace_invitations_project_created_idx").on(table.projectId, table.createdAt),
    index("workspace_invitations_normalized_email_idx").on(table.normalizedEmail),
    index("workspace_invitations_expires_at_idx").on(table.expiresAt),
    check("workspace_invitations_expiry_valid", sql`${table.expiresAt} > ${table.createdAt}`),
    check("workspace_invitations_delivery_attempt_positive", sql`${table.deliveryAttempt} > 0`),
    check(
      "workspace_invitations_kind_roles_valid",
      sql`(
        (
          ${table.kind} = 'workspace'
          AND ${table.workspaceRole} IS NOT NULL
          AND (
            (${table.projectId} IS NULL AND ${table.boardRole} IS NULL)
            OR (${table.projectId} IS NOT NULL AND ${table.boardRole} IS NOT NULL)
          )
        )
        OR
        (
          ${table.kind} = 'project'
          AND ${table.workspaceRole} IS NULL
          AND ${table.projectId} IS NOT NULL
          AND ${table.boardRole} IS NOT NULL
        )
      )`,
    ),
    check(
      "workspace_invitations_lifecycle_valid",
      sql`NOT (${table.acceptedAt} IS NOT NULL AND ${table.revokedAt} IS NOT NULL)`,
    ),
  ],
)

export const activityLogs = pgTable(
  "activity_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
    taskId: uuid("task_id").references(() => tasks.id, { onDelete: "set null" }),
    actorWorkspaceMemberId: uuid("actor_workspace_member_id").references(() => workspaceMembers.id, {
      onDelete: "set null",
    }),
    action: text("action").notNull(),
    schemaVersion: integer("schema_version").default(1).notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("activity_logs_workspace_created_idx").on(table.workspaceId, table.createdAt, table.id),
    index("activity_logs_project_created_idx").on(table.projectId, table.createdAt, table.id),
    index("activity_logs_task_created_idx").on(table.taskId, table.createdAt, table.id),
    index("activity_logs_actor_created_idx").on(table.actorWorkspaceMemberId, table.createdAt),
    check("activity_logs_action_nonempty", sql`length(trim(${table.action})) > 0`),
    check("activity_logs_schema_version_positive", sql`${table.schemaVersion} > 0`),
  ],
)

export const usersRelations = relations(users, ({ many }) => ({
  workspaceMemberships: many(workspaceMembers),
  assignedTasks: many(tasks, { relationName: "taskAssignee" }),
  comments: many(comments),
  rateLimitBuckets: many(rateLimitBuckets),
  aiUsageLogs: many(aiUsageLogs),
  acceptedInvitations: many(workspaceInvitations, { relationName: "acceptedInvitationUser" }),
  revokedInvitations: many(workspaceInvitations, { relationName: "revokedInvitationUser" }),
}))

export const workspacesRelations = relations(workspaces, ({ many, one }) => ({
  members: many(workspaceMembers, { relationName: "workspaceMemberships" }),
  ownerMembership: one(workspaceMembers, {
    fields: [workspaces.ownerWorkspaceMemberId],
    references: [workspaceMembers.id],
    relationName: "workspaceOwnerMembership",
  }),
  settings: one(workspaceSettings),
  projects: many(projects),
  rateLimitBuckets: many(rateLimitBuckets),
  aiUsageLogs: many(aiUsageLogs),
  invitations: many(workspaceInvitations),
  activityLogs: many(activityLogs),
}))

export const workspaceMembersRelations = relations(workspaceMembers, ({ many, one }) => ({
  user: one(users, {
    fields: [workspaceMembers.userId],
    references: [users.id],
  }),
  workspace: one(workspaces, {
    fields: [workspaceMembers.workspaceId],
    references: [workspaces.id],
    relationName: "workspaceMemberships",
  }),
  createdProjects: many(projects, { relationName: "projectCreator" }),
  createdLabels: many(labels, { relationName: "labelCreator" }),
  addedTaskLabels: many(taskLabels, { relationName: "taskLabelActor" }),
  projectMemberships: many(projectMembers),
  sentInvitations: many(workspaceInvitations),
  activityLogs: many(activityLogs),
}))

export const workspaceSettingsRelations = relations(workspaceSettings, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [workspaceSettings.workspaceId],
    references: [workspaces.id],
  }),
}))

export const projectsRelations = relations(projects, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [projects.workspaceId],
    references: [workspaces.id],
  }),
  creator: one(workspaceMembers, {
    fields: [projects.createdByWorkspaceMemberId],
    references: [workspaceMembers.id],
    relationName: "projectCreator",
  }),
  settings: one(projectSettings),
  lists: many(lists),
  labels: many(labels),
  members: many(projectMembers),
  aiUsageLogs: many(aiUsageLogs),
  invitations: many(workspaceInvitations),
  activityLogs: many(activityLogs),
}))

export const rateLimitBucketsRelations = relations(rateLimitBuckets, ({ one }) => ({
  actor: one(users, {
    fields: [rateLimitBuckets.actorUserId],
    references: [users.id],
  }),
  workspace: one(workspaces, {
    fields: [rateLimitBuckets.workspaceId],
    references: [workspaces.id],
  }),
}))

export const aiUsageLogsRelations = relations(aiUsageLogs, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [aiUsageLogs.workspaceId],
    references: [workspaces.id],
  }),
  user: one(users, {
    fields: [aiUsageLogs.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [aiUsageLogs.projectId],
    references: [projects.id],
  }),
}))

export const workspaceInvitationsRelations = relations(workspaceInvitations, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [workspaceInvitations.workspaceId],
    references: [workspaces.id],
  }),
  project: one(projects, {
    fields: [workspaceInvitations.projectId],
    references: [projects.id],
  }),
  invitedByWorkspaceMember: one(workspaceMembers, {
    fields: [workspaceInvitations.invitedByWorkspaceMemberId],
    references: [workspaceMembers.id],
  }),
  acceptedByUser: one(users, {
    fields: [workspaceInvitations.acceptedByUserId],
    references: [users.id],
    relationName: "acceptedInvitationUser",
  }),
  revokedByUser: one(users, {
    fields: [workspaceInvitations.revokedByUserId],
    references: [users.id],
    relationName: "revokedInvitationUser",
  }),
}))

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [activityLogs.workspaceId],
    references: [workspaces.id],
  }),
  project: one(projects, {
    fields: [activityLogs.projectId],
    references: [projects.id],
  }),
  task: one(tasks, {
    fields: [activityLogs.taskId],
    references: [tasks.id],
  }),
  actorWorkspaceMember: one(workspaceMembers, {
    fields: [activityLogs.actorWorkspaceMemberId],
    references: [workspaceMembers.id],
  }),
}))

export const projectSettingsRelations = relations(projectSettings, ({ one }) => ({
  project: one(projects, {
    fields: [projectSettings.projectId],
    references: [projects.id],
  }),
}))

export const projectMembersRelations = relations(projectMembers, ({ one }) => ({
  project: one(projects, {
    fields: [projectMembers.projectId],
    references: [projects.id],
  }),
  workspaceMember: one(workspaceMembers, {
    fields: [projectMembers.workspaceMemberId],
    references: [workspaceMembers.id],
  }),
}))

export const listsRelations = relations(lists, ({ one, many }) => ({
  project: one(projects, {
    fields: [lists.projectId],
    references: [projects.id],
  }),
  tasks: many(tasks),
}))

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  list: one(lists, {
    fields: [tasks.listId],
    references: [lists.id],
  }),
  assignee: one(users, {
    fields: [tasks.assigneeId],
    references: [users.id],
    relationName: "taskAssignee",
  }),
  comments: many(comments),
  labels: many(taskLabels),
  activityLogs: many(activityLogs),
}))

export const labelsRelations = relations(labels, ({ one, many }) => ({
  project: one(projects, {
    fields: [labels.projectId],
    references: [projects.id],
  }),
  creator: one(workspaceMembers, {
    fields: [labels.createdByWorkspaceMemberId],
    references: [workspaceMembers.id],
    relationName: "labelCreator",
  }),
  tasks: many(taskLabels),
}))

export const taskLabelsRelations = relations(taskLabels, ({ one }) => ({
  task: one(tasks, {
    fields: [taskLabels.taskId],
    references: [tasks.id],
  }),
  label: one(labels, {
    fields: [taskLabels.labelId],
    references: [labels.id],
  }),
  actor: one(workspaceMembers, {
    fields: [taskLabels.addedByWorkspaceMemberId],
    references: [workspaceMembers.id],
    relationName: "taskLabelActor",
  }),
}))

export const commentsRelations = relations(comments, ({ one }) => ({
  task: one(tasks, {
    fields: [comments.taskId],
    references: [tasks.id],
  }),
  author: one(users, {
    fields: [comments.authorId],
    references: [users.id],
  }),
}))

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Workspace = typeof workspaces.$inferSelect
export type NewWorkspace = typeof workspaces.$inferInsert
export type WorkspaceMember = typeof workspaceMembers.$inferSelect
export type NewWorkspaceMember = typeof workspaceMembers.$inferInsert
export type WorkspaceSettings = typeof workspaceSettings.$inferSelect
export type NewWorkspaceSettings = typeof workspaceSettings.$inferInsert
export type Project = typeof projects.$inferSelect
export type NewProject = typeof projects.$inferInsert
export type ProjectSettings = typeof projectSettings.$inferSelect
export type NewProjectSettings = typeof projectSettings.$inferInsert
export type ProjectMember = typeof projectMembers.$inferSelect
export type NewProjectMember = typeof projectMembers.$inferInsert
export type List = typeof lists.$inferSelect
export type NewList = typeof lists.$inferInsert
export type Task = typeof tasks.$inferSelect
export type NewTask = typeof tasks.$inferInsert
export type Label = typeof labels.$inferSelect
export type NewLabel = typeof labels.$inferInsert
export type TaskLabel = typeof taskLabels.$inferSelect
export type NewTaskLabel = typeof taskLabels.$inferInsert
export type Comment = typeof comments.$inferSelect
export type NewComment = typeof comments.$inferInsert
export type RateLimitBucket = typeof rateLimitBuckets.$inferSelect
export type NewRateLimitBucket = typeof rateLimitBuckets.$inferInsert
export type AiUsageLog = typeof aiUsageLogs.$inferSelect
export type NewAiUsageLog = typeof aiUsageLogs.$inferInsert
export type WorkspaceInvitation = typeof workspaceInvitations.$inferSelect
export type NewWorkspaceInvitation = typeof workspaceInvitations.$inferInsert
export type ActivityLog = typeof activityLogs.$inferSelect
export type NewActivityLog = typeof activityLogs.$inferInsert
export type TaskPriority = (typeof taskPriority.enumValues)[number]
export type BoardRole = (typeof boardRole.enumValues)[number]
export type SystemRole = (typeof systemRole.enumValues)[number]
export type AccountStatus = (typeof accountStatus.enumValues)[number]
export type WorkspaceStatus = (typeof workspaceStatus.enumValues)[number]
export type WorkspaceMemberRole = (typeof workspaceMemberRole.enumValues)[number]
export type RateLimitScope = (typeof rateLimitScope.enumValues)[number]
export type InvitationKind = (typeof invitationKind.enumValues)[number]
export type InvitationDeliveryStatus = (typeof invitationDeliveryStatus.enumValues)[number]
