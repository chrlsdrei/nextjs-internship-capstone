import { z } from "zod"

const providerTimestampSchema = z.union([z.number().finite(), z.string().trim().min(1)])

const paymentSchema = z.object({
  id: z.string().trim().min(1),
  type: z.literal("payment"),
  attributes: z.object({
    amount: z.number().int().positive(),
    currency: z.string().trim().length(3),
    status: z.literal("paid"),
    paid_at: providerTimestampSchema.optional(),
    created_at: providerTimestampSchema.optional(),
  }),
})

const checkoutSessionSchema = z.object({
  id: z.string().trim().min(1),
  type: z.literal("checkout_session"),
  attributes: z.object({
    reference_number: z.string().trim().min(1).max(255),
    payments: z.array(paymentSchema).min(1),
  }),
})

const standardEnvelopeSchema = z.object({
  data: z.object({
    id: z.string().trim().min(1),
    type: z.literal("event"),
    attributes: z.object({
      type: z.string().trim().min(1),
      livemode: z.boolean(),
      created_at: providerTimestampSchema,
      data: z.unknown(),
    }),
  }),
})

const hostedCheckoutEnvelopeSchema = z.object({
  event_type: z.literal("send.webhook"),
  data: z.object({
    type: z.string().trim().min(1),
    livemode: z.boolean(),
    created_at: providerTimestampSchema,
    data: z.unknown(),
  }),
})

export type ParsedPaymongoWebhook =
  | { type: "ignored"; eventType: string }
  | {
      type: "checkout_session.payment.paid"
      providerEventId: string
      providerCreatedAt: Date
      livemode: boolean
      checkoutSessionId: string
      referenceNumber: string
      paymentId: string
      amount: number
      currency: string
      paidAt: Date
    }

function providerDate(value: z.infer<typeof providerTimestampSchema>) {
  const date = typeof value === "number" ? new Date(value * 1_000) : new Date(value)
  if (Number.isNaN(date.getTime())) throw new Error("Invalid PayMongo timestamp")
  return date
}

export function parsePaymongoWebhook(value: unknown): ParsedPaymongoWebhook {
  const standard = standardEnvelopeSchema.safeParse(value)
  const normalized = standard.success
    ? {
        providerEventId: standard.data.data.id,
        eventType: standard.data.data.attributes.type,
        livemode: standard.data.data.attributes.livemode,
        createdAt: standard.data.data.attributes.created_at,
        sessionValue: standard.data.data.attributes.data,
      }
    : (() => {
        const hosted = hostedCheckoutEnvelopeSchema.parse(value)
        return {
          providerEventId: null,
          eventType: hosted.data.type,
          livemode: hosted.data.livemode,
          createdAt: hosted.data.created_at,
          sessionValue: hosted.data.data,
        }
      })()

  const eventType = normalized.eventType
  if (eventType !== "checkout_session.payment.paid") return { type: "ignored", eventType }

  const session = checkoutSessionSchema.parse(normalized.sessionValue)
  const payment = session.attributes.payments.find((item) => item.attributes.status === "paid")
  if (!payment) throw new Error("Paid checkout event did not include a paid payment")

  const providerEventId = normalized.providerEventId ?? `checkout_session.payment.paid:${session.id}:${payment.id}`

  return {
    type: "checkout_session.payment.paid",
    providerEventId,
    providerCreatedAt: providerDate(normalized.createdAt),
    livemode: normalized.livemode,
    checkoutSessionId: session.id,
    referenceNumber: session.attributes.reference_number,
    paymentId: payment.id,
    amount: payment.attributes.amount,
    currency: payment.attributes.currency.toUpperCase(),
    paidAt: providerDate(payment.attributes.paid_at ?? payment.attributes.created_at ?? normalized.createdAt),
  }
}
