CREATE TABLE "calendar_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"created_by_workspace_member_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"all_day" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "calendar_events_time_order" CHECK ("calendar_events"."ends_at" > "calendar_events"."starts_at")
);
--> statement-breakpoint
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_creator_workspace_member_fk" FOREIGN KEY ("created_by_workspace_member_id","workspace_id") REFERENCES "public"."workspace_members"("id","workspace_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "calendar_events_workspace_starts_idx" ON "calendar_events" USING btree ("workspace_id","starts_at");--> statement-breakpoint
CREATE INDEX "calendar_events_creator_idx" ON "calendar_events" USING btree ("created_by_workspace_member_id");