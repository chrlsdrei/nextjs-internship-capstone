import { z } from "zod"

const commentContent = z
  .string({ error: "Comment content is required" })
  .trim()
  .min(1, "Comment content is required")
  .max(5000, "Comment must be 5000 characters or fewer")

export const commentIdSchema = z.uuid("Comment ID must be a valid UUID")

export const createTaskCommentSchema = z.object({
  projectId: z.uuid("Project ID must be a valid UUID"),
  taskId: z.uuid("Task ID must be a valid UUID"),
  content: commentContent,
})

export const updateTaskCommentSchema = z.object({
  projectId: z.uuid("Project ID must be a valid UUID"),
  taskId: z.uuid("Task ID must be a valid UUID"),
  commentId: commentIdSchema,
  content: commentContent,
})

export const deleteTaskCommentSchema = z.object({
  projectId: z.uuid("Project ID must be a valid UUID"),
  taskId: z.uuid("Task ID must be a valid UUID"),
  commentId: commentIdSchema,
})

export const taskCommentPageSchema = z.object({
  projectId: z.uuid("Project ID must be a valid UUID"),
  taskId: z.uuid("Task ID must be a valid UUID"),
  limit: z.number().int().min(1).max(50).default(20),
  cursor: z.object({ createdAt: z.coerce.date(), id: commentIdSchema }).optional(),
})

export type CreateTaskCommentInput = z.infer<typeof createTaskCommentSchema>
export type UpdateTaskCommentInput = z.infer<typeof updateTaskCommentSchema>
export type DeleteTaskCommentInput = z.infer<typeof deleteTaskCommentSchema>
export type TaskCommentPageInput = z.infer<typeof taskCommentPageSchema>
