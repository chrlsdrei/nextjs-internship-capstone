import { relations, sql } from "drizzle-orm"
import {
  type AnyPgColumn,
  boolean,
  check,
  foreignKey,
  index,
  integer,
  pgEnum,
  pgTable,
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
export const projectMemberRole = pgEnum("project_member_role", ["owner", "admin", "member"])
export const systemRole = pgEnum("system_role", ["user", "super_admin"])
export const accountStatus = pgEnum("account_status", ["active", "suspended", "deleted"])
export const workspaceStatus = pgEnum("workspace_status", ["active", "suspended", "deleted"])
export const workspaceMemberRole = pgEnum("workspace_member_role", ["admin", "member"])

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
    name: text("name").notNull(),
    description: text("description"),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    dueDate: timestamp("due_date", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [index("projects_owner_id_idx").on(table.ownerId)],
)

export const projectMembers = pgTable(
  "project_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: projectMemberRole("role").default("member").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("project_members_project_user_unique").on(table.projectId, table.userId),
    uniqueIndex("project_members_one_owner_per_project").on(table.projectId).where(sql`${table.role} = 'owner'`),
    index("project_members_project_id_idx").on(table.projectId),
    index("project_members_user_id_idx").on(table.userId),
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
    listId: uuid("list_id")
      .notNull()
      .references(() => lists.id, { onDelete: "cascade" }),
    assigneeId: uuid("assignee_id").references(() => users.id, { onDelete: "set null" }),
    priority: taskPriority("priority").default("medium").notNull(),
    dueDate: timestamp("due_date", { withTimezone: true }),
    position: integer("position").default(0).notNull(),
    ...timestamps,
  },
  (table) => [
    index("tasks_list_position_idx").on(table.listId, table.position),
    index("tasks_assignee_id_idx").on(table.assigneeId),
    check("tasks_position_nonnegative", sql`${table.position} >= 0`),
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

export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
  projectMemberships: many(projectMembers),
  workspaceMemberships: many(workspaceMembers),
  assignedTasks: many(tasks, { relationName: "taskAssignee" }),
  comments: many(comments),
}))

export const workspacesRelations = relations(workspaces, ({ many, one }) => ({
  members: many(workspaceMembers, { relationName: "workspaceMemberships" }),
  ownerMembership: one(workspaceMembers, {
    fields: [workspaces.ownerWorkspaceMemberId],
    references: [workspaceMembers.id],
    relationName: "workspaceOwnerMembership",
  }),
  settings: one(workspaceSettings),
}))

export const workspaceMembersRelations = relations(workspaceMembers, ({ one }) => ({
  user: one(users, {
    fields: [workspaceMembers.userId],
    references: [users.id],
  }),
  workspace: one(workspaces, {
    fields: [workspaceMembers.workspaceId],
    references: [workspaces.id],
    relationName: "workspaceMemberships",
  }),
}))

export const workspaceSettingsRelations = relations(workspaceSettings, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [workspaceSettings.workspaceId],
    references: [workspaces.id],
  }),
}))

export const projectsRelations = relations(projects, ({ one, many }) => ({
  owner: one(users, {
    fields: [projects.ownerId],
    references: [users.id],
  }),
  lists: many(lists),
  members: many(projectMembers),
}))

export const projectMembersRelations = relations(projectMembers, ({ one }) => ({
  project: one(projects, {
    fields: [projectMembers.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [projectMembers.userId],
    references: [users.id],
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
export type ProjectMember = typeof projectMembers.$inferSelect
export type NewProjectMember = typeof projectMembers.$inferInsert
export type List = typeof lists.$inferSelect
export type NewList = typeof lists.$inferInsert
export type Task = typeof tasks.$inferSelect
export type NewTask = typeof tasks.$inferInsert
export type Comment = typeof comments.$inferSelect
export type NewComment = typeof comments.$inferInsert
export type TaskPriority = (typeof taskPriority.enumValues)[number]
export type ProjectMemberRole = (typeof projectMemberRole.enumValues)[number]
export type SystemRole = (typeof systemRole.enumValues)[number]
export type AccountStatus = (typeof accountStatus.enumValues)[number]
export type WorkspaceStatus = (typeof workspaceStatus.enumValues)[number]
export type WorkspaceMemberRole = (typeof workspaceMemberRole.enumValues)[number]
