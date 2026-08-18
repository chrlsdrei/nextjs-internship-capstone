CREATE TYPE "public"."ai_usage_status" AS ENUM('pending', 'succeeded', 'failed');--> statement-breakpoint
CREATE TYPE "public"."billing_interval" AS ENUM('monthly', 'yearly');--> statement-breakpoint
CREATE TYPE "public"."billing_subscription_status" AS ENUM('incomplete', 'incomplete_cancelled', 'active', 'past_due', 'unpaid', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."billing_target" AS ENUM('user', 'workspace');--> statement-breakpoint
CREATE TYPE "public"."billing_webhook_status" AS ENUM('processing', 'processed', 'failed');--> statement-breakpoint
CREATE TABLE "ai_board_summaries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"usage_id" uuid NOT NULL,
	"metrics" jsonb NOT NULL,
	"executive_summary" text NOT NULL,
	"progress" text NOT NULL,
	"deadline_risks" text NOT NULL,
	"unassigned_work" text NOT NULL,
	"activity_highlights" jsonb NOT NULL,
	"suggested_actions" jsonb NOT NULL,
	"activity_window_starts_at" timestamp with time zone NOT NULL,
	"activity_window_ends_at" timestamp with time zone NOT NULL,
	"model" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "billing_customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"paymongo_customer_id" text NOT NULL,
	"livemode" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "billing_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"target" "billing_target" NOT NULL,
	"paymongo_plan_id" text,
	"livemode" boolean DEFAULT false NOT NULL,
	"currency" text DEFAULT 'PHP' NOT NULL,
	"amount" integer DEFAULT 0 NOT NULL,
	"interval" "billing_interval" DEFAULT 'monthly' NOT NULL,
	"max_projects" integer,
	"max_members" integer,
	"monthly_board_generations" integer DEFAULT 0 NOT NULL,
	"monthly_task_generations" integer DEFAULT 0 NOT NULL,
	"monthly_summaries" integer DEFAULT 0 NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "billing_plans_amount_nonnegative" CHECK ("billing_plans"."amount" >= 0),
	CONSTRAINT "billing_plans_version_positive" CHECK ("billing_plans"."version" > 0),
	CONSTRAINT "billing_plans_limits_nonnegative" CHECK (coalesce("billing_plans"."max_projects", 0) >= 0 AND coalesce("billing_plans"."max_members", 0) >= 0 AND "billing_plans"."monthly_board_generations" >= 0 AND "billing_plans"."monthly_task_generations" >= 0 AND "billing_plans"."monthly_summaries" >= 0)
);
--> statement-breakpoint
CREATE TABLE "billing_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" uuid NOT NULL,
	"target" "billing_target" NOT NULL,
	"user_id" uuid,
	"workspace_id" uuid,
	"payer_user_id" uuid NOT NULL,
	"billing_customer_id" uuid NOT NULL,
	"paymongo_subscription_id" text NOT NULL,
	"status" "billing_subscription_status" DEFAULT 'incomplete' NOT NULL,
	"current_period_starts_at" timestamp with time zone NOT NULL,
	"current_period_ends_at" timestamp with time zone NOT NULL,
	"next_billing_at" timestamp with time zone,
	"provider_updated_at" timestamp with time zone NOT NULL,
	"cancelled_at" timestamp with time zone,
	"cancellation_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "billing_subscriptions_target_valid" CHECK (("billing_subscriptions"."target" = 'user' AND "billing_subscriptions"."user_id" IS NOT NULL AND "billing_subscriptions"."workspace_id" IS NULL) OR ("billing_subscriptions"."target" = 'workspace' AND "billing_subscriptions"."workspace_id" IS NOT NULL AND "billing_subscriptions"."user_id" IS NULL)),
	CONSTRAINT "billing_subscriptions_period_valid" CHECK ("billing_subscriptions"."current_period_ends_at" > "billing_subscriptions"."current_period_starts_at")
);
--> statement-breakpoint
CREATE TABLE "billing_webhook_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider_event_id" text NOT NULL,
	"event_type" text NOT NULL,
	"status" "billing_webhook_status" DEFAULT 'processing' NOT NULL,
	"provider_created_at" timestamp with time zone NOT NULL,
	"payload_hash" text NOT NULL,
	"error_code" text,
	"processed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_usage_logs" DROP CONSTRAINT "ai_usage_logs_tokens_nonnegative";--> statement-breakpoint
ALTER TABLE "ai_usage_logs" ADD COLUMN "request_key" text DEFAULT gen_random_uuid()::text NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_usage_logs" ADD COLUMN "status" "ai_usage_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_usage_logs" ADD COLUMN "provider_request_id" text;--> statement-breakpoint
ALTER TABLE "ai_usage_logs" ADD COLUMN "result_resource_id" uuid;--> statement-breakpoint
ALTER TABLE "ai_usage_logs" ADD COLUMN "input_tokens" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_usage_logs" ADD COLUMN "output_tokens" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_usage_logs" ADD COLUMN "error_code" text;--> statement-breakpoint
ALTER TABLE "ai_usage_logs" ADD COLUMN "period_starts_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_usage_logs" ADD COLUMN "period_ends_at" timestamp with time zone DEFAULT NOW() + INTERVAL '1 month' NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_usage_logs" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
UPDATE "ai_usage_logs"
SET "status" = 'succeeded',
	"output_tokens" = "tokens_used",
	"period_starts_at" = date_trunc('month', "created_at"),
	"period_ends_at" = date_trunc('month', "created_at") + INTERVAL '1 month',
	"updated_at" = "created_at";--> statement-breakpoint
ALTER TABLE "ai_board_summaries" ADD CONSTRAINT "ai_board_summaries_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_board_summaries" ADD CONSTRAINT "ai_board_summaries_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_board_summaries" ADD CONSTRAINT "ai_board_summaries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_board_summaries" ADD CONSTRAINT "ai_board_summaries_usage_id_ai_usage_logs_id_fk" FOREIGN KEY ("usage_id") REFERENCES "public"."ai_usage_logs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_board_summaries" ADD CONSTRAINT "ai_board_summaries_project_workspace_fk" FOREIGN KEY ("project_id","workspace_id") REFERENCES "public"."projects"("id","workspace_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_customers" ADD CONSTRAINT "billing_customers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_subscriptions" ADD CONSTRAINT "billing_subscriptions_plan_id_billing_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."billing_plans"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_subscriptions" ADD CONSTRAINT "billing_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_subscriptions" ADD CONSTRAINT "billing_subscriptions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_subscriptions" ADD CONSTRAINT "billing_subscriptions_payer_user_id_users_id_fk" FOREIGN KEY ("payer_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_subscriptions" ADD CONSTRAINT "billing_subscriptions_billing_customer_id_billing_customers_id_fk" FOREIGN KEY ("billing_customer_id") REFERENCES "public"."billing_customers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ai_board_summaries_usage_unique" ON "ai_board_summaries" USING btree ("usage_id");--> statement-breakpoint
CREATE INDEX "ai_board_summaries_project_created_idx" ON "ai_board_summaries" USING btree ("project_id","created_at","id");--> statement-breakpoint
CREATE UNIQUE INDEX "billing_customers_user_mode_unique" ON "billing_customers" USING btree ("user_id","livemode");--> statement-breakpoint
CREATE UNIQUE INDEX "billing_customers_paymongo_unique" ON "billing_customers" USING btree ("paymongo_customer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "billing_plans_code_version_unique" ON "billing_plans" USING btree ("code","version","livemode");--> statement-breakpoint
CREATE UNIQUE INDEX "billing_plans_paymongo_plan_unique" ON "billing_plans" USING btree ("paymongo_plan_id");--> statement-breakpoint
CREATE INDEX "billing_plans_target_active_idx" ON "billing_plans" USING btree ("target","active","livemode");--> statement-breakpoint
CREATE UNIQUE INDEX "billing_subscriptions_paymongo_unique" ON "billing_subscriptions" USING btree ("paymongo_subscription_id");--> statement-breakpoint
CREATE INDEX "billing_subscriptions_user_status_idx" ON "billing_subscriptions" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "billing_subscriptions_workspace_status_idx" ON "billing_subscriptions" USING btree ("workspace_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "billing_webhook_events_provider_id_unique" ON "billing_webhook_events" USING btree ("provider_event_id");--> statement-breakpoint
CREATE INDEX "billing_webhook_events_status_created_idx" ON "billing_webhook_events" USING btree ("status","provider_created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "ai_usage_logs_user_request_unique" ON "ai_usage_logs" USING btree ("user_id","request_key");--> statement-breakpoint
ALTER TABLE "ai_usage_logs" ADD CONSTRAINT "ai_usage_logs_period_valid" CHECK ("ai_usage_logs"."period_ends_at" > "ai_usage_logs"."period_starts_at");--> statement-breakpoint
ALTER TABLE "ai_usage_logs" ADD CONSTRAINT "ai_usage_logs_tokens_nonnegative" CHECK ("ai_usage_logs"."input_tokens" >= 0 AND "ai_usage_logs"."output_tokens" >= 0 AND "ai_usage_logs"."tokens_used" >= 0);
