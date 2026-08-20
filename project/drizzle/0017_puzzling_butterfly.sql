CREATE TYPE "public"."billing_checkout_purchase_status" AS ENUM('pending', 'paid', 'cancelled', 'expired', 'failed');--> statement-breakpoint
CREATE TABLE "billing_checkout_purchases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" uuid NOT NULL,
	"target" "billing_target" NOT NULL,
	"user_id" uuid,
	"workspace_id" uuid,
	"payer_user_id" uuid NOT NULL,
	"reference_number" text NOT NULL,
	"paymongo_checkout_session_id" text,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'PHP' NOT NULL,
	"status" "billing_checkout_purchase_status" DEFAULT 'pending' NOT NULL,
	"checkout_url" text,
	"provider_created_at" timestamp with time zone,
	"paid_at" timestamp with time zone,
	"access_ends_at" timestamp with time zone,
	"failure_code" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "billing_checkout_purchases_target_valid" CHECK (("billing_checkout_purchases"."target" = 'user' AND "billing_checkout_purchases"."user_id" IS NOT NULL AND "billing_checkout_purchases"."workspace_id" IS NULL) OR ("billing_checkout_purchases"."target" = 'workspace' AND "billing_checkout_purchases"."workspace_id" IS NOT NULL AND "billing_checkout_purchases"."user_id" IS NULL)),
	CONSTRAINT "billing_checkout_purchases_amount_positive" CHECK ("billing_checkout_purchases"."amount" > 0),
	CONSTRAINT "billing_checkout_purchases_currency_valid" CHECK (char_length("billing_checkout_purchases"."currency") = 3 AND "billing_checkout_purchases"."currency" = upper("billing_checkout_purchases"."currency")),
	CONSTRAINT "billing_checkout_purchases_paid_state_valid" CHECK ("billing_checkout_purchases"."status" <> 'paid' OR "billing_checkout_purchases"."paid_at" IS NOT NULL)
);
--> statement-breakpoint
ALTER TABLE "billing_checkout_purchases" ADD CONSTRAINT "billing_checkout_purchases_plan_id_billing_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."billing_plans"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_checkout_purchases" ADD CONSTRAINT "billing_checkout_purchases_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_checkout_purchases" ADD CONSTRAINT "billing_checkout_purchases_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_checkout_purchases" ADD CONSTRAINT "billing_checkout_purchases_payer_user_id_users_id_fk" FOREIGN KEY ("payer_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "billing_checkout_purchases_reference_unique" ON "billing_checkout_purchases" USING btree ("reference_number");--> statement-breakpoint
CREATE UNIQUE INDEX "billing_checkout_purchases_paymongo_session_unique" ON "billing_checkout_purchases" USING btree ("paymongo_checkout_session_id");--> statement-breakpoint
CREATE INDEX "billing_checkout_purchases_user_status_idx" ON "billing_checkout_purchases" USING btree ("user_id","status","created_at");--> statement-breakpoint
CREATE INDEX "billing_checkout_purchases_workspace_status_idx" ON "billing_checkout_purchases" USING btree ("workspace_id","status","created_at");--> statement-breakpoint
CREATE INDEX "billing_checkout_purchases_payer_status_idx" ON "billing_checkout_purchases" USING btree ("payer_user_id","status","created_at");--> statement-breakpoint
CREATE INDEX "billing_checkout_purchases_plan_idx" ON "billing_checkout_purchases" USING btree ("plan_id");