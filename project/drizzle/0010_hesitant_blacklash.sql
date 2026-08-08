CREATE TABLE "labels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"name" text NOT NULL,
	"normalized_name" text NOT NULL,
	"color" text NOT NULL,
	"created_by_workspace_member_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "labels_id_project_unique" UNIQUE("id","project_id"),
	CONSTRAINT "labels_name_nonempty" CHECK (length(btrim("labels"."name")) > 0),
	CONSTRAINT "labels_normalized_name_valid" CHECK ("labels"."normalized_name" = lower(regexp_replace(btrim("labels"."name"), '\s+', ' ', 'g'))),
	CONSTRAINT "labels_color_hex" CHECK ("labels"."color" ~ '^#[0-9A-Fa-f]{6}$')
);
--> statement-breakpoint
CREATE TABLE "task_labels" (
	"project_id" uuid NOT NULL,
	"task_id" uuid NOT NULL,
	"label_id" uuid NOT NULL,
	"added_by_workspace_member_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "task_labels_task_label_pk" PRIMARY KEY("task_id","label_id")
);
--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_id_project_unique" UNIQUE("id","project_id");--> statement-breakpoint
ALTER TABLE "labels" ADD CONSTRAINT "labels_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "labels" ADD CONSTRAINT "labels_created_by_workspace_member_id_workspace_members_id_fk" FOREIGN KEY ("created_by_workspace_member_id") REFERENCES "public"."workspace_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_labels" ADD CONSTRAINT "task_labels_added_by_workspace_member_id_workspace_members_id_fk" FOREIGN KEY ("added_by_workspace_member_id") REFERENCES "public"."workspace_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_labels" ADD CONSTRAINT "task_labels_task_project_fk" FOREIGN KEY ("task_id","project_id") REFERENCES "public"."tasks"("id","project_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_labels" ADD CONSTRAINT "task_labels_label_project_fk" FOREIGN KEY ("label_id","project_id") REFERENCES "public"."labels"("id","project_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "labels_project_normalized_name_unique" ON "labels" USING btree ("project_id","normalized_name");--> statement-breakpoint
CREATE INDEX "labels_project_name_idx" ON "labels" USING btree ("project_id","name");--> statement-breakpoint
CREATE INDEX "labels_creator_workspace_member_idx" ON "labels" USING btree ("created_by_workspace_member_id");--> statement-breakpoint
CREATE INDEX "task_labels_project_label_idx" ON "task_labels" USING btree ("project_id","label_id");--> statement-breakpoint
CREATE INDEX "task_labels_actor_idx" ON "task_labels" USING btree ("added_by_workspace_member_id");
