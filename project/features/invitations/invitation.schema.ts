import { z } from "zod"

const email = z.string().trim().email("Enter a valid email address").max(320, "Email is too long")
const workspaceRole = z.enum(["admin", "member"])
const boardRole = z.enum(["board_admin", "editor", "viewer"])

export const createWorkspaceInvitationSchema = z
  .object({
    workspaceId: z.uuid("Select a valid workspace"),
    email,
    workspaceRole: workspaceRole.default("member"),
    projectId: z.uuid("Select a valid project").optional(),
    boardRole: boardRole.optional(),
  })
  .refine((value) => Boolean(value.projectId) === Boolean(value.boardRole), {
    message: "A project and board role must be supplied together",
    path: ["projectId"],
  })

export const createProjectInvitationSchema = z.object({
  projectId: z.uuid("Select a valid project"),
  email,
  boardRole: boardRole.default("viewer"),
})

export const invitationIdSchema = z.uuid("Invalid invitation")
export const acceptInvitationSchema = z.object({
  token: z.string().trim().min(32, "Invalid invitation token").max(512, "Invalid invitation token"),
})

export type CreateWorkspaceInvitationInput = z.infer<typeof createWorkspaceInvitationSchema>
export type CreateProjectInvitationInput = z.infer<typeof createProjectInvitationSchema>
