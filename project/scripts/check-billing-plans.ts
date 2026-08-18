import { config } from "dotenv"

config({ path: ".env.local" })

import { listActiveBillingPlans } from "../features/billing/server/billing.repository"
import { paymongoLivemode, retrievePaymongoPlan } from "../features/billing/server/paymongo.gateway"

async function main() {
  const plans = await listActiveBillingPlans()
  for (const plan of plans) {
    if (!plan.paymongoPlanId) {
      console.log(`${plan.code}: free/local plan`)
      continue
    }
    const provider = await retrievePaymongoPlan(plan.paymongoPlanId)
    if (provider.data.attributes.livemode !== paymongoLivemode()) throw new Error(`${plan.code}: mode mismatch`)
    if (provider.data.attributes.amount !== plan.amount) throw new Error(`${plan.code}: amount mismatch`)
    console.log(`${plan.code}: verified`)
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
