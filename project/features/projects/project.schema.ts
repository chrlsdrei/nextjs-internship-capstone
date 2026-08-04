import { z } from "zod"

const optionalDate = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.coerce.date().optional(),
)

const optionalNullableDate = z.preprocess(
  (value) => (value === "" ? null : value),
  z.coerce.date().nullable().optional(),
)

export const projectIdSchema = z.uuid("Project ID must be a valid UUID")

export const projectSchema = z.object({
  name: z.string().trim().min(1, "Project name is required").max(100, "Project name must be 100 characters or fewer"),
  description: z.string().trim().max(500, "Description must be 500 characters or fewer").nullable().optional(),
  dueDate: optionalDate,
})

export const updateProjectSchema = projectSchema
  .omit({ dueDate: true })
  .partial()
  .extend({ dueDate: optionalNullableDate })

export type CreateProjectInput = z.infer<typeof projectSchema>
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>
