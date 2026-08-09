CREATE TABLE "task_assignees" (
	"project_id" uuid NOT NULL,
	"task_id" uuid NOT NULL,
	"project_member_id" uuid NOT NULL,
	"assigned_by_workspace_member_id" uuid,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "task_assignees_task_member_pk" PRIMARY KEY("task_id","project_member_id")
);
--> statement-breakpoint
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_assignee_id_users_id_fk";
--> statement-breakpoint
DROP INDEX "tasks_assignee_id_idx";--> statement-breakpoint
ALTER TABLE "task_assignees" ADD CONSTRAINT "task_assignees_assigned_by_workspace_member_id_workspace_members_id_fk" FOREIGN KEY ("assigned_by_workspace_member_id") REFERENCES "public"."workspace_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_assignees" ADD CONSTRAINT "task_assignees_task_project_fk" FOREIGN KEY ("task_id","project_id") REFERENCES "public"."tasks"("id","project_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_assignees" ADD CONSTRAINT "task_assignees_member_project_fk" FOREIGN KEY ("project_member_id","project_id") REFERENCES "public"."project_members"("id","project_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "task_assignees_project_member_idx" ON "task_assignees" USING btree ("project_member_id");--> statement-breakpoint
CREATE INDEX "task_assignees_project_task_idx" ON "task_assignees" USING btree ("project_id","task_id");--> statement-breakpoint
CREATE INDEX "task_assignees_actor_idx" ON "task_assignees" USING btree ("assigned_by_workspace_member_id");--> statement-breakpoint
CREATE FUNCTION "validate_active_task_assignee"() RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM "project_members" AS "project_member"
		INNER JOIN "workspace_members" AS "workspace_member"
			ON "workspace_member"."id" = "project_member"."workspace_member_id"
		WHERE "project_member"."id" = NEW."project_member_id"
			AND "project_member"."project_id" = NEW."project_id"
			AND "project_member"."removed_at" IS NULL
			AND "workspace_member"."removed_at" IS NULL
	) THEN
		RAISE EXCEPTION 'Task assignees must be active explicit project members' USING ERRCODE = '23514';
	END IF;
	RETURN NEW;
END;
$$;--> statement-breakpoint
CREATE TRIGGER "task_assignees_require_active_membership"
BEFORE INSERT OR UPDATE OF "project_id", "project_member_id" ON "task_assignees"
FOR EACH ROW EXECUTE FUNCTION "validate_active_task_assignee"();--> statement-breakpoint
INSERT INTO "task_assignees" ("project_id", "task_id", "project_member_id")
SELECT "task"."project_id", "task"."id", "project_member"."id"
FROM "tasks" AS "task"
INNER JOIN "workspace_members" AS "workspace_member"
	ON "workspace_member"."user_id" = "task"."assignee_id"
	AND "workspace_member"."removed_at" IS NULL
INNER JOIN "project_members" AS "project_member"
	ON "project_member"."project_id" = "task"."project_id"
	AND "project_member"."workspace_member_id" = "workspace_member"."id"
	AND "project_member"."removed_at" IS NULL
WHERE "task"."assignee_id" IS NOT NULL
ON CONFLICT ("task_id", "project_member_id") DO NOTHING;--> statement-breakpoint
ALTER TABLE "tasks" DROP COLUMN "assignee_id";
