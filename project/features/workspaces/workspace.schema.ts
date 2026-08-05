import { z } from "zod"

const optionalDescription = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? null : value),
  z.string().trim().max(500, "Description must be 500 characters or fewer").nullable().optional(),
)

export const workspaceIdSchema = z.uuid("Select a valid workspace")
export const workspaceMemberIdSchema = z.uuid("Select a valid workspace member")
export const workspaceMemberRoleSchema = z.enum(["admin", "member"])

export const createWorkspaceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Workspace name is required")
    .max(100, "Workspace name must be 100 characters or fewer"),
  description: optionalDescription,
})

export const updateWorkspaceDetailsSchema = createWorkspaceSchema
  .partial()
  .refine((values) => Object.keys(values).length > 0, "Provide at least one workspace field to update")

export const updateWorkspaceSettingsSchema = z.object({
  membersCanCreateProjects: z.boolean(),
})

export const updateWorkspaceMemberRoleSchema = z.object({
  memberId: workspaceMemberIdSchema,
  role: workspaceMemberRoleSchema,
})

export const removeWorkspaceMemberSchema = z.object({
  memberId: workspaceMemberIdSchema,
})

export const transferWorkspaceOwnershipSchema = z.object({
  newOwnerMemberId: workspaceMemberIdSchema,
})

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>
export type UpdateWorkspaceDetailsInput = z.infer<typeof updateWorkspaceDetailsSchema>
export type UpdateWorkspaceSettingsInput = z.infer<typeof updateWorkspaceSettingsSchema>
export type UpdateWorkspaceMemberRoleInput = z.infer<typeof updateWorkspaceMemberRoleSchema>
export type RemoveWorkspaceMemberInput = z.infer<typeof removeWorkspaceMemberSchema>
export type TransferWorkspaceOwnershipInput = z.infer<typeof transferWorkspaceOwnershipSchema>
