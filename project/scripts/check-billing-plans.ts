import { config } from "dotenv"

config({ path: ".env.local" })

import { checkoutProductCatalog, checkoutProductCodes } from "../features/billing/billing.catalog"
import { paymongoLivemode } from "../features/billing/gateways/paymongo.gateway"
import { listActiveBillingPlans } from "../features/billing/repositories/billing.repository"

async function main() {
  const livemode = paymongoLivemode()
  const plans = await listActiveBillingPlans(undefined, livemode)
  const activeByCode = new Map(plans.map((plan) => [plan.code, plan]))
  const missing = checkoutProductCodes.filter((code) => !activeByCode.has(code))
  if (missing.length > 0) throw new Error(`Missing active checkout products: ${missing.join(", ")}`)

  for (const code of checkoutProductCodes) {
    const expected = checkoutProductCatalog[code]
    const plan = activeByCode.get(code)
    if (!plan) continue
    if (plan.name !== expected.name) throw new Error(`${code}: name mismatch`)
    if (plan.target !== expected.target) throw new Error(`${code}: target mismatch`)
    if (plan.currency !== expected.currency) throw new Error(`${code}: currency mismatch`)
    if (plan.amount !== expected.amount) throw new Error(`${code}: amount mismatch`)
    if (plan.interval !== expected.interval) throw new Error(`${code}: interval mismatch`)
    if (plan.maxProjects !== expected.maxProjects) throw new Error(`${code}: project capacity mismatch`)
    if (plan.maxMembers !== expected.maxMembers) throw new Error(`${code}: member capacity mismatch`)
    if (plan.livemode !== livemode) throw new Error(`${code}: database mode mismatch`)
    if (plan.paymongoPlanId !== null) throw new Error(`${code}: recurring PayMongo plan ID must be empty`)
    console.log(`${code}: verified local checkout product`)
  }

  console.log(`Verified all four ${livemode ? "live" : "test"} local checkout products.`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
