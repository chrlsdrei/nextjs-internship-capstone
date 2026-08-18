CREATE TYPE "public"."subscription_tier" AS ENUM('free', 'pro');--> statement-breakpoint
ALTER TABLE "billing_plans" DROP CONSTRAINT "billing_plans_limits_nonnegative";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "subscription_tier" "subscription_tier" DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "subscription_started_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "subscription_ends_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "workspaces" ADD COLUMN "subscription_tier" "subscription_tier" DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE "workspaces" ADD COLUMN "subscription_started_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "workspaces" ADD COLUMN "subscription_ends_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "billing_plans" DROP COLUMN "monthly_board_generations";--> statement-breakpoint
ALTER TABLE "billing_plans" DROP COLUMN "monthly_task_generations";--> statement-breakpoint
ALTER TABLE "billing_plans" DROP COLUMN "monthly_summaries";--> statement-breakpoint
ALTER TABLE "billing_plans" ADD CONSTRAINT "billing_plans_limits_nonnegative" CHECK (coalesce("billing_plans"."max_projects", 0) >= 0 AND coalesce("billing_plans"."max_members", 0) >= 0);--> statement-breakpoint
DROP FUNCTION IF EXISTS "public"."reserve_ai_usage"(uuid, uuid, uuid, text, text, text, text, integer, text, timestamptz, timestamptz);--> statement-breakpoint
UPDATE "users" AS "target"
SET
	"subscription_tier" = 'pro',
	"subscription_started_at" = "current_subscription"."current_period_starts_at",
	"subscription_ends_at" = "current_subscription"."current_period_ends_at"
FROM (
	SELECT DISTINCT ON ("user_id")
		"user_id", "current_period_starts_at", "current_period_ends_at"
	FROM "billing_subscriptions"
	WHERE "target" = 'user' AND "status" IN ('active', 'past_due') AND "user_id" IS NOT NULL
	ORDER BY "user_id", "provider_updated_at" DESC
) AS "current_subscription"
WHERE "target"."id" = "current_subscription"."user_id"
	AND "current_subscription"."current_period_ends_at" > NOW();--> statement-breakpoint
UPDATE "workspaces" AS "target"
SET
	"subscription_tier" = 'pro',
	"subscription_started_at" = "current_subscription"."current_period_starts_at",
	"subscription_ends_at" = "current_subscription"."current_period_ends_at"
FROM (
	SELECT DISTINCT ON ("workspace_id")
		"workspace_id", "current_period_starts_at", "current_period_ends_at"
	FROM "billing_subscriptions"
	WHERE "target" = 'workspace' AND "status" IN ('active', 'past_due') AND "workspace_id" IS NOT NULL
	ORDER BY "workspace_id", "provider_updated_at" DESC
) AS "current_subscription"
WHERE "target"."id" = "current_subscription"."workspace_id"
	AND "current_subscription"."current_period_ends_at" > NOW();--> statement-breakpoint
CREATE OR REPLACE FUNCTION "public"."set_subscription_period_from_tier"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
	IF NEW."subscription_tier" = 'pro' AND (
		OLD."subscription_tier" IS DISTINCT FROM 'pro'
		OR NEW."subscription_ends_at" IS NULL
		OR NEW."subscription_ends_at" <= NOW()
	) THEN
		NEW."subscription_started_at" = NOW();
		NEW."subscription_ends_at" = NOW() + INTERVAL '30 days';
	ELSIF NEW."subscription_tier" = 'free' THEN
		NEW."subscription_started_at" = NULL;
		NEW."subscription_ends_at" = NULL;
	END IF;
	RETURN NEW;
END;
$$;--> statement-breakpoint
CREATE TRIGGER "users_subscription_tier_period"
BEFORE UPDATE OF "subscription_tier" ON "users"
FOR EACH ROW
EXECUTE FUNCTION "public"."set_subscription_period_from_tier"();--> statement-breakpoint
CREATE TRIGGER "workspaces_subscription_tier_period"
BEFORE UPDATE OF "subscription_tier" ON "workspaces"
FOR EACH ROW
EXECUTE FUNCTION "public"."set_subscription_period_from_tier"();
