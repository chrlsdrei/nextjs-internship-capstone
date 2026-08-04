import { relations, sql } from "drizzle-orm"
import { check, index, integer, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core"

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
}

export const taskPriority = pgEnum("task_priority", ["low", "medium", "high"])
export const projectMemberRole = pgEnum("project_member_role", ["owner", "admin", "member"])

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clerkId: text("clerk_id").notNull(),
    email: text("email").notNull(),
    name: text("name").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("users_clerk_id_unique").on(table.clerkId),
    uniqueIndex("users_email_unique").on(table.email),
  ],
)

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
  assignedTasks: many(tasks, { relationName: "taskAssignee" }),
  comments: many(comments),
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
