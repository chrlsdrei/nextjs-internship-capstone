import { config } from "dotenv"

config({ path: ".env.local" })

import { eq } from "drizzle-orm"
import { z } from "zod"

import { createPaymongoPlan, paymongoLivemode } from "../features/billing/server/paymongo.gateway"
import { db } from "../server/db/client"
import { billingPlans } from "../server/db/schema"

const args = Object.fromEntries(
  process.argv.slice(2).map((value) => {
    const [key, ...rest] = value.replace(/^--/, "").split("=")
    return [key, rest.join("=")]
  }),
)

const schema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  target: z.enum(["user", "workspace"]),
  amount: z.coerce.number().int().min(0),
  interval: z.enum(["monthly", "yearly"]),
  mode: z.enum(["test", "live"]),
  maxProjects: z.coerce.number().int().min(0).optional(),
  maxMembers: z.coerce.number().int().min(0).optional(),
  version: z.coerce.number().int().positive(),
  confirm: z.literal("UPSERT_BILLING_PLAN"),
})

async function main() {
  const input = schema.parse(args)
  const livemode = paymongoLivemode()
  if ((input.mode === "live") !== livemode) throw new Error("The --mode value does not match PAYMONGO_SECRET_KEY")
  let paymongoPlanId: string | null = null
  if (input.amount > 0) {
    const provider = await createPaymongoPlan({
      name: input.name,
      description: `${input.target} subscription for ProjectFlow`,
      amount: input.amount,
      interval: input.interval,
      idempotencyKey: `plan:${input.code}:${input.version}:${livemode}`,
    })
    if (provider.data.attributes.livemode !== livemode) throw new Error("PayMongo returned a plan in the wrong mode")
    paymongoPlanId = provider.data.id
  }
  const [plan] = await db
    .insert(billingPlans)
    .values({
      code: input.code,
      name: input.name,
      target: input.target,
      amount: input.amount,
      interval: input.interval,
      maxProjects: input.maxProjects,
      maxMembers: input.maxMembers,
      version: input.version,
      livemode,
      paymongoPlanId,
    })
    .onConflictDoUpdate({
      target: [billingPlans.code, billingPlans.version, billingPlans.livemode],
      set: {
        name: input.name,
        amount: input.amount,
        interval: input.interval,
        maxProjects: input.maxProjects,
        maxMembers: input.maxMembers,
        paymongoPlanId,
        active: true,
        updatedAt: new Date(),
      },
    })
    .returning()
  if (!plan) throw new Error("Unable to upsert billing plan")
  await db.update(billingPlans).set({ active: false }).where(eq(billingPlans.code, input.code))
  await db.update(billingPlans).set({ active: true }).where(eq(billingPlans.id, plan.id))
  console.log(`Billing plan ${plan.code} v${plan.version} configured (${livemode ? "live" : "test"}).`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
