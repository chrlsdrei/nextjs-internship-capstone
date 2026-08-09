import { z } from "zod"
import { labelIdSchema } from "@/features/labels/label.schema"

const requiredText = (field: string, maximum: number) =>
  z.string().trim().min(1, `${field} is required`).max(maximum, `${field} must be ${maximum} characters or fewer`)

const optionalDate = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.coerce.date().optional(),
)

const optionalNullableDate = z.preprocess(
  (value) => (value === "" ? null : value),
  z.coerce.date().nullable().optional(),
)

export const listIdSchema = z.uuid("List ID must be a valid UUID")
export const taskIdSchema = z.uuid("Task ID must be a valid UUID")
export const taskAssigneeIdSchema = z.uuid("Assignee project-member ID must be a valid UUID")

const uniqueIds = (field: string) => (values: string[], context: z.RefinementCtx) => {
  if (new Set(values).size !== values.length) {
    context.addIssue({ code: "custom", message: `${field} cannot contain duplicates` })
  }
}

const taskAssigneeIdsSchema = z
  .array(taskAssigneeIdSchema)
  .max(50, "A task can have at most 50 assignees")
  .superRefine(uniqueIds("Assignee IDs"))

export const listSchema = z.object({
  name: requiredText("List name", 100),
  position: z.int().min(0, "Position cannot be negative").default(0),
})

export const updateListSchema = listSchema.partial()

export const reorderListsSchema = z.object({
  listIds: z.array(listIdSchema).min(1, "At least one list is required").superRefine(uniqueIds("List IDs")),
})

export const taskSchema = z.object({
  title: requiredText("Task title", 200),
  description: z.string().trim().max(1000, "Description must be 1000 characters or fewer").nullable().optional(),
  listId: listIdSchema,
  assigneeIds: taskAssigneeIdsSchema.default([]),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  dueDate: optionalDate,
  position: z.int().min(0, "Position cannot be negative").default(0),
  labelIds: z
    .array(labelIdSchema)
    .max(50, "A task can have at most 50 labels")
    .refine((ids) => new Set(ids).size === ids.length, "Label IDs cannot contain duplicates")
    .default([]),
})

export const updateTaskSchema = taskSchema
  .omit({ listId: true, dueDate: true, labelIds: true, assigneeIds: true })
  .partial()
  .extend({
    listId: listIdSchema.optional(),
    dueDate: optionalNullableDate,
    labelIds: z
      .array(labelIdSchema)
      .max(50, "A task can have at most 50 labels")
      .refine((ids) => new Set(ids).size === ids.length, "Label IDs cannot contain duplicates")
      .optional(),
    assigneeIds: taskAssigneeIdsSchema.optional(),
  })

export const setTaskAssigneesSchema = z.object({
  projectId: z.uuid("Project ID must be a valid UUID"),
  taskId: taskIdSchema,
  projectMemberIds: taskAssigneeIdsSchema,
})

export const changeTaskAssigneeSchema = z.object({
  projectId: z.uuid("Project ID must be a valid UUID"),
  taskId: taskIdSchema,
  projectMemberId: taskAssigneeIdSchema,
})

export const reorderTasksSchema = z.object({
  taskIds: z.array(taskIdSchema).min(1, "At least one task is required").superRefine(uniqueIds("Task IDs")),
})

export const moveTaskSchema = z.object({
  targetListId: listIdSchema,
  targetIndex: z.coerce.number().int().min(0, "Target position cannot be negative").optional(),
})

export type CreateListInput = z.infer<typeof listSchema>
export type UpdateListInput = z.infer<typeof updateListSchema>
export type ReorderListsInput = z.infer<typeof reorderListsSchema>
export type CreateTaskInput = z.infer<typeof taskSchema>
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>
export type ReorderTasksInput = z.infer<typeof reorderTasksSchema>
export type MoveTaskInput = z.infer<typeof moveTaskSchema>
export type SetTaskAssigneesInput = z.infer<typeof setTaskAssigneesSchema>
export type ChangeTaskAssigneeInput = z.infer<typeof changeTaskAssigneeSchema>
