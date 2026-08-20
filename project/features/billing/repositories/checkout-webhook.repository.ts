import "server-only"

import { createHash } from "node:crypto"
import { eq, sql } from "drizzle-orm"

import { db } from "@/server/db/client"
import { billingCheckoutPurchases, billingPlans } from "@/server/db/schema"

export async function findCheckoutPurchaseForWebhook(referenceNumber: string) {
  const [row] = await db
    .select({ purchase: billingCheckoutPurchases, plan: billingPlans })
    .from(billingCheckoutPurchases)
    .innerJoin(billingPlans, eq(billingPlans.id, billingCheckoutPurchases.planId))
    .where(eq(billingCheckoutPurchases.referenceNumber, referenceNumber))
    .limit(1)
  return row ?? null
}

export async function recordCheckoutWebhookFailure(input: {
  providerEventId: string
  eventType: string
  providerCreatedAt: Date
  rawBody: string
  errorCode: string
}) {
  const payloadHash = createHash("sha256").update(input.rawBody).digest("hex")
  await db.execute(sql`
    INSERT INTO "billing_webhook_events" (
      "provider_event_id", "event_type", "provider_created_at", "payload_hash", "status", "error_code", "processed_at"
    ) VALUES (
      ${input.providerEventId}, ${input.eventType}, ${input.providerCreatedAt}, ${payloadHash}, 'failed',
      ${input.errorCode.slice(0, 100)}, NOW()
    )
    ON CONFLICT ("provider_event_id") DO UPDATE SET
      "status" = 'failed', "error_code" = EXCLUDED."error_code", "processed_at" = NOW(), "updated_at" = NOW()
    WHERE "billing_webhook_events"."status" <> 'processed'
      AND "billing_webhook_events"."payload_hash" = EXCLUDED."payload_hash"
  `)
}

export async function fulfillCheckoutPurchase(input: {
  purchaseId: string
  target: "user" | "workspace"
  userId: string | null
  workspaceId: string | null
  providerEventId: string
  providerCreatedAt: Date
  rawBody: string
  checkoutSessionId: string
  referenceNumber: string
  paidAt: Date
}) {
  const payloadHash = createHash("sha256").update(input.rawBody).digest("hex")
  const result = await db.execute<{
    claimed: boolean
    fulfilled: boolean
    purchase_id: string | null
    access_ends_at: Date | string | null
  }>(sql`
    WITH event_claim AS (
      INSERT INTO "billing_webhook_events" (
        "provider_event_id", "event_type", "provider_created_at", "payload_hash", "status"
      ) VALUES (
        ${input.providerEventId}, 'checkout_session.payment.paid', ${input.providerCreatedAt}, ${payloadHash}, 'processing'
      )
      ON CONFLICT ("provider_event_id") DO UPDATE SET
        "status" = 'processing', "error_code" = NULL, "processed_at" = NULL, "updated_at" = NOW()
      WHERE "billing_webhook_events"."status" = 'failed'
        AND "billing_webhook_events"."payload_hash" = EXCLUDED."payload_hash"
      RETURNING "id"
    ), eligible_purchase AS (
      SELECT purchase.*
      FROM "billing_checkout_purchases" AS purchase
      CROSS JOIN event_claim
      WHERE purchase."id" = ${input.purchaseId}
        AND purchase."reference_number" = ${input.referenceNumber}
        AND purchase."target" = ${input.target}
        AND purchase."user_id" IS NOT DISTINCT FROM ${input.userId}
        AND purchase."workspace_id" IS NOT DISTINCT FROM ${input.workspaceId}
        AND (purchase."paymongo_checkout_session_id" IS NULL OR purchase."paymongo_checkout_session_id" = ${input.checkoutSessionId})
        AND purchase."status" IN ('pending', 'failed')
    ), user_update AS (
      UPDATE "users" AS account
      SET
        "subscription_tier" = 'pro',
        "subscription_started_at" = CASE
          WHEN account."subscription_tier" = 'pro' AND account."subscription_ends_at" > NOW()
            THEN COALESCE(account."subscription_started_at", NOW())
          ELSE NOW()
        END,
        "subscription_ends_at" = GREATEST(COALESCE(account."subscription_ends_at", NOW()), NOW()) + INTERVAL '30 days',
        "updated_at" = NOW()
      FROM eligible_purchase AS purchase
      WHERE purchase."target" = 'user' AND account."id" = purchase."user_id"
      RETURNING account."id", account."subscription_ends_at"
    ), workspace_update AS (
      UPDATE "workspaces" AS workspace
      SET
        "subscription_tier" = 'pro',
        "subscription_started_at" = CASE
          WHEN workspace."subscription_tier" = 'pro' AND workspace."subscription_ends_at" > NOW()
            THEN COALESCE(workspace."subscription_started_at", NOW())
          ELSE NOW()
        END,
        "subscription_ends_at" = GREATEST(COALESCE(workspace."subscription_ends_at", NOW()), NOW()) + INTERVAL '30 days',
        "updated_at" = NOW()
      FROM eligible_purchase AS purchase
      WHERE purchase."target" = 'workspace' AND workspace."id" = purchase."workspace_id"
      RETURNING workspace."id", workspace."subscription_ends_at"
    ), purchase_update AS (
      UPDATE "billing_checkout_purchases" AS purchase
      SET
        "status" = 'paid',
        "paymongo_checkout_session_id" = COALESCE(purchase."paymongo_checkout_session_id", ${input.checkoutSessionId}),
        "paid_at" = ${input.paidAt},
        "access_ends_at" = COALESCE(
          (SELECT "subscription_ends_at" FROM user_update LIMIT 1),
          (SELECT "subscription_ends_at" FROM workspace_update LIMIT 1)
        ),
        "failure_code" = NULL,
        "updated_at" = NOW()
      FROM eligible_purchase
      WHERE purchase."id" = eligible_purchase."id"
      RETURNING purchase."id", purchase."access_ends_at"
    ), event_finish AS (
      UPDATE "billing_webhook_events" AS event
      SET "status" = 'processed', "error_code" = NULL, "processed_at" = NOW(), "updated_at" = NOW()
      FROM event_claim
      WHERE event."id" = event_claim."id"
      RETURNING event."id"
    )
    SELECT
      EXISTS(SELECT 1 FROM event_claim) AS claimed,
      EXISTS(SELECT 1 FROM purchase_update) AS fulfilled,
      (SELECT "id"::text FROM purchase_update LIMIT 1) AS purchase_id,
      (SELECT "access_ends_at" FROM purchase_update LIMIT 1) AS access_ends_at
  `)
  return result.rows[0] ?? { claimed: false, fulfilled: false, purchase_id: null, access_ends_at: null }
}
