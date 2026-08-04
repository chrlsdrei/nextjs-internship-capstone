import { z } from "zod"

export const projectMemberIdSchema = z.uuid("Member ID must be a valid UUID")

export const projectMemberSchema = z.object({
  email: z.email("Enter a valid member email address").transform((email) => email.toLowerCase()),
  role: z.enum(["admin", "member"]).default("member"),
})

export const updateProjectMemberRoleSchema = z.object({
  role: z.enum(["admin", "member"]),
})

export const transferProjectOwnershipSchema = z.object({
  memberId: projectMemberIdSchema,
})

export type ProjectMemberInput = z.infer<typeof projectMemberSchema>
export type UpdateProjectMemberRoleInput = z.infer<typeof updateProjectMemberRoleSchema>
export type TransferProjectOwnershipInput = z.infer<typeof transferProjectOwnershipSchema>
