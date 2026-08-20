CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipient_user_id" uuid NOT NULL,
	"actor_user_id" uuid,
	"workspace_id" uuid,
	"project_id" uuid,
	"task_id" uuid,
	"type" text NOT NULL,
	"dedupe_key" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"href" text,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notifications_type_nonempty" CHECK (length(trim("notifications"."type")) > 0),
	CONSTRAINT "notifications_dedupe_key_nonempty" CHECK (length(trim("notifications"."dedupe_key")) > 0),
	CONSTRAINT "notifications_title_nonempty" CHECK (length(trim("notifications"."title")) > 0),
	CONSTRAINT "notifications_message_nonempty" CHECK (length(trim("notifications"."message")) > 0)
);
--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_user_id_users_id_fk" FOREIGN KEY ("recipient_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ALTER CONSTRAINT "notifications_workspace_id_workspaces_id_fk" DEFERRABLE INITIALLY DEFERRED;--> statement-breakpoint
ALTER TABLE "notifications" ALTER CONSTRAINT "notifications_project_id_projects_id_fk" DEFERRABLE INITIALLY DEFERRED;--> statement-breakpoint
ALTER TABLE "notifications" ALTER CONSTRAINT "notifications_task_id_tasks_id_fk" DEFERRABLE INITIALLY DEFERRED;--> statement-breakpoint
CREATE UNIQUE INDEX "notifications_recipient_dedupe_unique" ON "notifications" USING btree ("recipient_user_id","dedupe_key");--> statement-breakpoint
CREATE INDEX "notifications_recipient_created_idx" ON "notifications" USING btree ("recipient_user_id","created_at");--> statement-breakpoint
CREATE INDEX "notifications_recipient_unread_idx" ON "notifications" USING btree ("recipient_user_id","created_at") WHERE "notifications"."read_at" is null;--> statement-breakpoint
CREATE INDEX "notifications_project_idx" ON "notifications" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "notifications_task_idx" ON "notifications" USING btree ("task_id");
