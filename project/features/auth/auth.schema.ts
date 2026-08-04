import { z } from "zod"

export const userProfileSchema = z.object({
  email: z.email("Enter a valid email address").trim().toLowerCase(),
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be 100 characters or fewer"),
})

export const userSyncSchema = userProfileSchema.extend({
  clerkId: z.string().trim().min(1, "Clerk user ID is required"),
})

export type UserProfileInput = z.infer<typeof userProfileSchema>
export type UserSyncInput = z.infer<typeof userSyncSchema>
