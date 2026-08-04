import { z } from "zod"

const trimmedText = (field: string, maximum: number) =>
  z.string().trim().min(1, `${field} is required`).max(maximum, `${field} must be ${maximum} characters or fewer`)

const optionalDate = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.coerce.date().optional(),
)

const optionalNullableDate = z.preprocess(
  (value) => (value === "" ? null : value),
  z.coerce.date().nullable().optional(),
)

export const projectSchema = z.object({
  name: trimmedText("Project name", 100),
  description: z.string().trim().max(500, "Description must be 500 characters or fewer").nullable().optional(),
  dueDate: optionalDate,
})

export const updateProjectSchema = projectSchema
  .omit({ dueDate: true })
  .partial()
  .extend({ dueDate: optionalNullableDate })

export const projectMemberSchema = z.object({
  email: z.email("Enter a valid member email address").transform((email) => email.toLowerCase()),
  role: z.enum(["admin", "member"]).default("member"),
})

export const projectIdSchema = z.uuid("Project ID must be a valid UUID")
export const projectMemberIdSchema = z.uuid("Member ID must be a valid UUID")
export const listIdSchema = z.uuid("List ID must be a valid UUID")
export const taskIdSchema = z.uuid("Task ID must be a valid UUID")

export const updateProjectMemberRoleSchema = z.object({
  role: z.enum(["admin", "member"]),
})

export const transferProjectOwnershipSchema = z.object({
  memberId: projectMemberIdSchema,
})

export const listSchema = z.object({
  name: trimmedText("List name", 100),
  projectId: projectIdSchema,
  position: z.int().min(0, "Position cannot be negative").default(0),
})

export const updateListSchema = listSchema.omit({ projectId: true }).partial()

const uniqueIds = (field: string) => (values: string[], context: z.RefinementCtx) => {
  if (new Set(values).size !== values.length) {
    context.addIssue({ code: "custom", message: `${field} cannot contain duplicates` })
  }
}

export const reorderListsSchema = z.object({
  listIds: z.array(listIdSchema).min(1, "At least one list is required").superRefine(uniqueIds("List IDs")),
})

export const taskSchema = z.object({
  title: trimmedText("Task title", 200),
  description: z.string().trim().max(1000, "Description must be 1000 characters or fewer").nullable().optional(),
  listId: listIdSchema,
  assigneeId: z.preprocess(
    (value) => (value === "" ? null : value),
    z.uuid("Assignee ID must be a valid UUID").nullable().optional(),
  ),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  dueDate: optionalDate,
  position: z.int().min(0, "Position cannot be negative").default(0),
})

export const updateTaskSchema = taskSchema.omit({ listId: true, dueDate: true }).partial().extend({
  listId: listIdSchema.optional(),
  dueDate: optionalNullableDate,
})

export const reorderTasksSchema = z.object({
  taskIds: z.array(taskIdSchema).min(1, "At least one task is required").superRefine(uniqueIds("Task IDs")),
})

export const moveTaskSchema = z.object({
  targetListId: listIdSchema,
  targetIndex: z.coerce.number().int().min(0, "Target position cannot be negative").optional(),
})

export const commentSchema = z.object({
  content: trimmedText("Comment", 2000),
  taskId: z.uuid("Task ID must be a valid UUID"),
  authorId: z.uuid("Author ID must be a valid UUID"),
})

export const updateCommentSchema = commentSchema.pick({ content: true })

export const userProfileSchema = z.object({
  email: z.email("Enter a valid email address").transform((email) => email.toLowerCase()),
  name: trimmedText("Name", 100),
})

export const userSyncSchema = userProfileSchema.extend({
  clerkId: z.string().trim().min(1, "Clerk user ID is required"),
})

export type CreateProjectInput = z.infer<typeof projectSchema>
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>
export type ProjectMemberInput = z.infer<typeof projectMemberSchema>
export type UpdateProjectMemberRoleInput = z.infer<typeof updateProjectMemberRoleSchema>
export type TransferProjectOwnershipInput = z.infer<typeof transferProjectOwnershipSchema>
export type CreateListInput = z.infer<typeof listSchema>
export type UpdateListInput = z.infer<typeof updateListSchema>
export type ReorderListsInput = z.infer<typeof reorderListsSchema>
export type CreateTaskInput = z.infer<typeof taskSchema>
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>
export type ReorderTasksInput = z.infer<typeof reorderTasksSchema>
export type MoveTaskInput = z.infer<typeof moveTaskSchema>
export type CreateCommentInput = z.infer<typeof commentSchema>
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>
export type UserProfileInput = z.infer<typeof userProfileSchema>
export type UserSyncInput = z.infer<typeof userSyncSchema>
