import { z } from "zod"

export const createCalendarEventSchema = z
  .object({
    workspaceId: z.uuid("Select a valid workspace"),
    title: z.string().trim().min(1, "Event title is required").max(120, "Event title is too long"),
    description: z
      .string()
      .trim()
      .max(1000, "Description must be 1000 characters or fewer")
      .transform((value) => value || null),
    startsAt: z.coerce.date("Enter a valid start date"),
    endsAt: z.coerce.date("Enter a valid end date"),
    allDay: z.boolean(),
  })
  .refine((value) => value.endsAt > value.startsAt, {
    message: "The event must end after it starts",
    path: ["endsAt"],
  })
  .refine((value) => value.endsAt.getTime() - value.startsAt.getTime() <= 366 * 24 * 60 * 60 * 1000, {
    message: "An event cannot span more than one year",
    path: ["endsAt"],
  })

export type CreateCalendarEventInput = z.infer<typeof createCalendarEventSchema>
