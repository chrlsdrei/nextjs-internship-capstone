ALTER TABLE "workspace_invitations" DROP CONSTRAINT "workspace_invitations_lifecycle_valid";--> statement-breakpoint
DROP INDEX "workspace_invitations_active_workspace_email_unique";--> statement-breakpoint
DROP INDEX "workspace_invitations_active_project_email_unique";--> statement-breakpoint
ALTER TABLE "workspace_invitations" ADD COLUMN "declined_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "workspace_invitations" ADD COLUMN "declined_by_user_id" uuid;--> statement-breakpoint
ALTER TABLE "workspace_invitations" ADD CONSTRAINT "workspace_invitations_declined_by_user_id_users_id_fk" FOREIGN KEY ("declined_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_invitations_active_workspace_email_unique" ON "workspace_invitations" USING btree ("workspace_id","normalized_email") WHERE "workspace_invitations"."kind" = 'workspace' AND "workspace_invitations"."accepted_at" IS NULL AND "workspace_invitations"."revoked_at" IS NULL AND "workspace_invitations"."declined_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_invitations_active_project_email_unique" ON "workspace_invitations" USING btree ("project_id","normalized_email") WHERE "workspace_invitations"."kind" = 'project' AND "workspace_invitations"."accepted_at" IS NULL AND "workspace_invitations"."revoked_at" IS NULL AND "workspace_invitations"."declined_at" IS NULL;--> statement-breakpoint
ALTER TABLE "workspace_invitations" ADD CONSTRAINT "workspace_invitations_lifecycle_valid" CHECK (NOT (
        ("workspace_invitations"."accepted_at" IS NOT NULL AND "workspace_invitations"."revoked_at" IS NOT NULL)
        OR ("workspace_invitations"."accepted_at" IS NOT NULL AND "workspace_invitations"."declined_at" IS NOT NULL)
        OR ("workspace_invitations"."revoked_at" IS NOT NULL AND "workspace_invitations"."declined_at" IS NOT NULL)
      ));