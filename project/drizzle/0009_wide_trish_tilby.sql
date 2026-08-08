CREATE TABLE "activity_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"project_id" uuid,
	"task_id" uuid,
	"actor_workspace_member_id" uuid,
	"action" text NOT NULL,
	"schema_version" integer DEFAULT 1 NOT NULL,
	"metadata" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "activity_logs_action_nonempty" CHECK (length(trim("activity_logs"."action")) > 0),
	CONSTRAINT "activity_logs_schema_version_positive" CHECK ("activity_logs"."schema_version" > 0)
);
--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_actor_workspace_member_id_workspace_members_id_fk" FOREIGN KEY ("actor_workspace_member_id") REFERENCES "public"."workspace_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_logs_workspace_created_idx" ON "activity_logs" USING btree ("workspace_id","created_at","id");--> statement-breakpoint
CREATE INDEX "activity_logs_project_created_idx" ON "activity_logs" USING btree ("project_id","created_at","id");--> statement-breakpoint
CREATE INDEX "activity_logs_task_created_idx" ON "activity_logs" USING btree ("task_id","created_at","id");--> statement-breakpoint
CREATE INDEX "activity_logs_actor_created_idx" ON "activity_logs" USING btree ("actor_workspace_member_id","created_at");
--> statement-breakpoint
CREATE OR REPLACE FUNCTION "prevent_activity_log_mutation"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
	IF TG_OP = 'UPDATE'
		AND pg_trigger_depth() > 1
		AND NEW."id" = OLD."id"
		AND NEW."workspace_id" = OLD."workspace_id"
		AND NEW."action" = OLD."action"
		AND NEW."schema_version" = OLD."schema_version"
		AND NEW."metadata" = OLD."metadata"
		AND NEW."created_at" = OLD."created_at"
		AND (NEW."project_id" = OLD."project_id" OR NEW."project_id" IS NULL)
		AND (NEW."task_id" = OLD."task_id" OR NEW."task_id" IS NULL)
		AND (NEW."actor_workspace_member_id" = OLD."actor_workspace_member_id" OR NEW."actor_workspace_member_id" IS NULL)
	THEN
		RETURN NEW;
	END IF;
	RAISE EXCEPTION 'activity_logs is append-only' USING ERRCODE = '55000';
END;
$$;
--> statement-breakpoint
CREATE TRIGGER "activity_logs_append_only"
BEFORE UPDATE OR DELETE ON "activity_logs"
FOR EACH ROW EXECUTE FUNCTION "prevent_activity_log_mutation"();
