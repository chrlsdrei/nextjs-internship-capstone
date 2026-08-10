CREATE TYPE "public"."rate_limit_scope" AS ENUM('actor', 'workspace');--> statement-breakpoint
CREATE TABLE "ai_usage_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"project_id" uuid,
	"quota_key" text NOT NULL,
	"action" text NOT NULL,
	"model" text,
	"tokens_used" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ai_usage_logs_tokens_nonnegative" CHECK ("ai_usage_logs"."tokens_used" >= 0)
);
--> statement-breakpoint
CREATE TABLE "rate_limit_buckets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scope" "rate_limit_scope" NOT NULL,
	"scope_key" uuid NOT NULL,
	"actor_user_id" uuid,
	"workspace_id" uuid,
	"action" text NOT NULL,
	"window_started_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"request_count" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rate_limit_buckets_scope_window_unique" UNIQUE("scope","scope_key","action","window_started_at"),
	CONSTRAINT "rate_limit_buckets_count_positive" CHECK ("rate_limit_buckets"."request_count" > 0),
	CONSTRAINT "rate_limit_buckets_window_valid" CHECK ("rate_limit_buckets"."expires_at" > "rate_limit_buckets"."window_started_at"),
	CONSTRAINT "rate_limit_buckets_scope_reference_valid" CHECK ((
        ("rate_limit_buckets"."scope" = 'actor' AND "rate_limit_buckets"."actor_user_id" = "rate_limit_buckets"."scope_key" AND "rate_limit_buckets"."workspace_id" IS NULL)
        OR
        ("rate_limit_buckets"."scope" = 'workspace' AND "rate_limit_buckets"."workspace_id" = "rate_limit_buckets"."scope_key" AND "rate_limit_buckets"."actor_user_id" IS NULL)
      ))
);
--> statement-breakpoint
ALTER TABLE "ai_usage_logs" ADD CONSTRAINT "ai_usage_logs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_usage_logs" ADD CONSTRAINT "ai_usage_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_usage_logs" ADD CONSTRAINT "ai_usage_logs_project_workspace_fk" FOREIGN KEY ("project_id","workspace_id") REFERENCES "public"."projects"("id","workspace_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rate_limit_buckets" ADD CONSTRAINT "rate_limit_buckets_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rate_limit_buckets" ADD CONSTRAINT "rate_limit_buckets_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_usage_logs_workspace_quota_created_idx" ON "ai_usage_logs" USING btree ("workspace_id","quota_key","created_at");--> statement-breakpoint
CREATE INDEX "ai_usage_logs_user_created_idx" ON "ai_usage_logs" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "ai_usage_logs_project_created_idx" ON "ai_usage_logs" USING btree ("project_id","created_at");--> statement-breakpoint
CREATE INDEX "rate_limit_buckets_actor_action_idx" ON "rate_limit_buckets" USING btree ("actor_user_id","action");--> statement-breakpoint
CREATE INDEX "rate_limit_buckets_workspace_action_idx" ON "rate_limit_buckets" USING btree ("workspace_id","action");--> statement-breakpoint
CREATE INDEX "rate_limit_buckets_expires_at_idx" ON "rate_limit_buckets" USING btree ("expires_at");