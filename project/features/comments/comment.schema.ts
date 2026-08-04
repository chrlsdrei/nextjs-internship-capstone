import { z } from "zod"

export const createCommentSchema = z.object({
  content: z.string().trim().min(1, "Comment is required").max(2000, "Comment must be 2000 characters or fewer"),
  taskId: z.uuid("Task ID must be a valid UUID"),
  authorId: z.uuid("Author ID must be a valid UUID"),
})

export const updateCommentSchema = createCommentSchema.pick({ content: true })

export type CreateCommentInput = z.infer<typeof createCommentSchema>
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>
