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

export const listSchema = z.object({
  name: trimmedText("List name", 100),
  projectId: z.uuid("Project ID must be a valid UUID"),
  position: z.int().min(0, "Position cannot be negative").default(0),
})

export const updateListSchema = listSchema.omit({ projectId: true }).partial()

export const taskSchema = z.object({
  title: trimmedText("Task title", 200),
  description: z.string().trim().max(1000, "Description must be 1000 characters or fewer").nullable().optional(),
  listId: z.uuid("List ID must be a valid UUID"),
  assigneeId: z.uuid("Assignee ID must be a valid UUID").nullable().optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  dueDate: optionalDate,
  position: z.int().min(0, "Position cannot be negative").default(0),
})

export const updateTaskSchema = taskSchema
  .omit({ listId: true, dueDate: true })
  .partial()
  .extend({
    listId: z.uuid("List ID must be a valid UUID").optional(),
    dueDate: optionalNullableDate,
  })

export const commentSchema = z.object({
  content: trimmedText("Comment", 2000),
  taskId: z.uuid("Task ID must be a valid UUID"),
  authorId: z.uuid("Author ID must be a valid UUID"),
})

export const updateCommentSchema = commentSchema.pick({ content: true })

export const userProfileSchema = z.object({
  email: z.email("Enter a valid email address"),
  name: trimmedText("Name", 100),
})

export const userSyncSchema = userProfileSchema.extend({
  clerkId: z.string().trim().min(1, "Clerk user ID is required"),
})

export type CreateProjectInput = z.infer<typeof projectSchema>
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>
export type CreateListInput = z.infer<typeof listSchema>
export type UpdateListInput = z.infer<typeof updateListSchema>
export type CreateTaskInput = z.infer<typeof taskSchema>
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>
export type CreateCommentInput = z.infer<typeof commentSchema>
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>
export type UserProfileInput = z.infer<typeof userProfileSchema>
export type UserSyncInput = z.infer<typeof userSyncSchema>
