ALTER TABLE "project_members" DROP CONSTRAINT "project_members_workspace_member_fk";
--> statement-breakpoint
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_workspace_member_fk" FOREIGN KEY ("workspace_member_id","workspace_id") REFERENCES "public"."workspace_members"("id","workspace_id") ON DELETE cascade ON UPDATE no action;