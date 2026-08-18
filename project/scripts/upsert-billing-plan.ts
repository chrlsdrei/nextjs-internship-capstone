import { config } from "dotenv"

config({ path: ".env.local" })

import { and, eq } from "drizzle-orm"
import { z } from "zod"

import {
  type CheckoutProductCode,
  checkoutProductCatalog,
  checkoutProductCodes,
} from "../features/billing/billing.catalog"
import { paymongoLivemode } from "../features/billing/server/paymongo.gateway"
import { db } from "../server/db/client"
import { billingPlans } from "../server/db/schema"

const args = Object.fromEntries(
  process.argv.slice(2).map((value) => {
    const [key, ...rest] = value.replace(/^--/, "").split("=")
    return [key, rest.join("=")]
  }),
)

const schema = z.object({
  code: z.enum(checkoutProductCodes),
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
  const expected = checkoutProductCatalog[input.code as CheckoutProductCode]
  if (input.name !== expected.name) throw new Error(`${input.code}: expected name ${expected.name}`)
  if (input.target !== expected.target) throw new Error(`${input.code}: expected target ${expected.target}`)
  if (input.amount !== expected.amount) throw new Error(`${input.code}: expected amount ${expected.amount}`)
  if (input.interval !== expected.interval) throw new Error(`${input.code}: expected interval ${expected.interval}`)
  if ((input.maxProjects ?? null) !== expected.maxProjects)
    throw new Error(`${input.code}: expected maxProjects ${expected.maxProjects ?? "unset"}`)
  if ((input.maxMembers ?? null) !== expected.maxMembers)
    throw new Error(`${input.code}: expected maxMembers ${expected.maxMembers ?? "unset"}`)

  const [plan] = await db
    .insert(billingPlans)
    .values({
      code: input.code,
      name: input.name,
      target: input.target,
      amount: input.amount,
      currency: expected.currency,
      interval: input.interval,
      maxProjects: input.maxProjects,
      maxMembers: input.maxMembers,
      version: input.version,
      livemode,
      paymongoPlanId: null,
    })
    .onConflictDoUpdate({
      target: [billingPlans.code, billingPlans.version, billingPlans.livemode],
      set: {
        name: input.name,
        amount: input.amount,
        currency: expected.currency,
        interval: input.interval,
        maxProjects: input.maxProjects,
        maxMembers: input.maxMembers,
        paymongoPlanId: null,
        active: true,
        updatedAt: new Date(),
      },
    })
    .returning()
  if (!plan) throw new Error("Unable to upsert billing plan")
  await db
    .update(billingPlans)
    .set({ active: false })
    .where(and(eq(billingPlans.code, input.code), eq(billingPlans.livemode, livemode)))
  await db.update(billingPlans).set({ active: true }).where(eq(billingPlans.id, plan.id))
  console.log(
    `Local checkout product ${plan.code} v${plan.version} configured (${livemode ? "live" : "test"}, ${expected.accessDurationDays}-day access).`,
  )
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
