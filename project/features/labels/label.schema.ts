import { z } from "zod"

export const labelIdSchema = z.uuid("Label ID must be a valid UUID")

export function normalizeLabelName(name: string) {
  return name.trim().replace(/\s+/g, " ").toLocaleLowerCase("en-US")
}

const labelNameSchema = z
  .string()
  .trim()
  .min(1, "Label name is required")
  .max(100, "Label name must be 100 characters or fewer")
  .transform((name) => name.replace(/\s+/g, " "))

const labelColorSchema = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, "Color must be a six-digit hexadecimal value such as #2563EB")
  .transform((color) => color.toLowerCase())

export const createLabelSchema = z
  .object({ name: labelNameSchema, color: labelColorSchema })
  .transform((values) => ({ ...values, normalizedName: normalizeLabelName(values.name) }))

export const updateLabelSchema = z
  .object({ name: labelNameSchema.optional(), color: labelColorSchema.optional() })
  .refine((values) => values.name !== undefined || values.color !== undefined, "Provide a label field to update")
  .transform((values) => ({
    ...values,
    normalizedName: values.name === undefined ? undefined : normalizeLabelName(values.name),
  }))

export const setTaskLabelsSchema = z.object({
  projectId: z.uuid("Project ID must be a valid UUID"),
  taskId: z.uuid("Task ID must be a valid UUID"),
  labelIds: z
    .array(labelIdSchema)
    .max(50, "A task can have at most 50 labels")
    .refine((ids) => new Set(ids).size === ids.length, "Label IDs cannot contain duplicates"),
})

export type CreateLabelInput = z.infer<typeof createLabelSchema>
export type UpdateLabelInput = z.infer<typeof updateLabelSchema>
export type SetTaskLabelsInput = z.infer<typeof setTaskLabelsSchema>
