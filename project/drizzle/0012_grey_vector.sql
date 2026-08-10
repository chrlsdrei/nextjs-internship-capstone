CREATE TABLE "task_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"task_id" uuid NOT NULL,
	"author_workspace_member_id" uuid,
	"author_name" text NOT NULL,
	"author_email" text NOT NULL,
	"content" text NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_by_workspace_member_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "task_comments_content_nonempty" CHECK (length(btrim("task_comments"."content")) > 0)
);
--> statement-breakpoint
ALTER TABLE "task_comments" ADD CONSTRAINT "task_comments_project_workspace_fk" FOREIGN KEY ("project_id","workspace_id") REFERENCES "public"."projects"("id","workspace_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_comments" ADD CONSTRAINT "task_comments_task_project_fk" FOREIGN KEY ("task_id","project_id") REFERENCES "public"."tasks"("id","project_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_comments" ADD CONSTRAINT "task_comments_author_workspace_member_id_workspace_members_id_fk" FOREIGN KEY ("author_workspace_member_id") REFERENCES "public"."workspace_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_comments" ADD CONSTRAINT "task_comments_deleted_by_workspace_member_id_workspace_members_id_fk" FOREIGN KEY ("deleted_by_workspace_member_id") REFERENCES "public"."workspace_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "task_comments_task_created_idx" ON "task_comments" USING btree ("task_id","created_at","id");--> statement-breakpoint
CREATE INDEX "task_comments_project_created_idx" ON "task_comments" USING btree ("project_id","created_at","id");--> statement-breakpoint
CREATE INDEX "task_comments_author_idx" ON "task_comments" USING btree ("author_workspace_member_id","created_at");--> statement-breakpoint
DROP TABLE "comments" CASCADE;
