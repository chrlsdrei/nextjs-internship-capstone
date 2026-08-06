import { z } from "zod"

export const projectMemberIdSchema = z.uuid("Member ID must be a valid UUID")

export const projectMemberSchema = z.object({
  email: z.email("Enter a valid member email address").transform((email) => email.toLowerCase()),
  role: z.enum(["board_admin", "editor", "viewer"]).default("viewer"),
})

export const updateProjectMemberRoleSchema = z.object({
  role: z.enum(["board_admin", "editor", "viewer"]),
})

export type ProjectMemberInput = z.infer<typeof projectMemberSchema>
export type UpdateProjectMemberRoleInput = z.infer<typeof updateProjectMemberRoleSchema>
