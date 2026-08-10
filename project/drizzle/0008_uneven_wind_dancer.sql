CREATE TYPE "public"."invitation_delivery_status" AS ENUM('pending', 'sent', 'failed');--> statement-breakpoint
CREATE TYPE "public"."invitation_kind" AS ENUM('workspace', 'project');--> statement-breakpoint
CREATE TABLE "workspace_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "invitation_kind" NOT NULL,
	"workspace_id" uuid NOT NULL,
	"project_id" uuid,
	"invited_by_workspace_member_id" uuid NOT NULL,
	"email" text NOT NULL,
	"normalized_email" text NOT NULL,
	"workspace_role" "workspace_member_role",
	"board_role" "board_role",
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	"accepted_by_user_id" uuid,
	"revoked_at" timestamp with time zone,
	"revoked_by_user_id" uuid,
	"delivery_status" "invitation_delivery_status" DEFAULT 'pending' NOT NULL,
	"delivery_attempt" integer DEFAULT 1 NOT NULL,
	"resend_message_id" text,
	"delivery_error_code" text,
	"last_sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workspace_invitations_expiry_valid" CHECK ("workspace_invitations"."expires_at" > "workspace_invitations"."created_at"),
	CONSTRAINT "workspace_invitations_delivery_attempt_positive" CHECK ("workspace_invitations"."delivery_attempt" > 0),
	CONSTRAINT "workspace_invitations_kind_roles_valid" CHECK ((
        (
          "workspace_invitations"."kind" = 'workspace'
          AND "workspace_invitations"."workspace_role" IS NOT NULL
          AND (
            ("workspace_invitations"."project_id" IS NULL AND "workspace_invitations"."board_role" IS NULL)
            OR ("workspace_invitations"."project_id" IS NOT NULL AND "workspace_invitations"."board_role" IS NOT NULL)
          )
        )
        OR
        (
          "workspace_invitations"."kind" = 'project'
          AND "workspace_invitations"."workspace_role" IS NULL
          AND "workspace_invitations"."project_id" IS NOT NULL
          AND "workspace_invitations"."board_role" IS NOT NULL
        )
      )),
	CONSTRAINT "workspace_invitations_lifecycle_valid" CHECK (NOT ("workspace_invitations"."accepted_at" IS NOT NULL AND "workspace_invitations"."revoked_at" IS NOT NULL))
);
--> statement-breakpoint
ALTER TABLE "workspace_invitations" ADD CONSTRAINT "workspace_invitations_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_invitations" ADD CONSTRAINT "workspace_invitations_accepted_by_user_id_users_id_fk" FOREIGN KEY ("accepted_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_invitations" ADD CONSTRAINT "workspace_invitations_revoked_by_user_id_users_id_fk" FOREIGN KEY ("revoked_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_invitations" ADD CONSTRAINT "workspace_invitations_project_workspace_fk" FOREIGN KEY ("project_id","workspace_id") REFERENCES "public"."projects"("id","workspace_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_invitations" ADD CONSTRAINT "workspace_invitations_inviter_workspace_fk" FOREIGN KEY ("invited_by_workspace_member_id","workspace_id") REFERENCES "public"."workspace_members"("id","workspace_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_invitations_token_hash_unique" ON "workspace_invitations" USING btree ("token_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_invitations_active_workspace_email_unique" ON "workspace_invitations" USING btree ("workspace_id","normalized_email") WHERE "workspace_invitations"."kind" = 'workspace' AND "workspace_invitations"."accepted_at" IS NULL AND "workspace_invitations"."revoked_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_invitations_active_project_email_unique" ON "workspace_invitations" USING btree ("project_id","normalized_email") WHERE "workspace_invitations"."kind" = 'project' AND "workspace_invitations"."accepted_at" IS NULL AND "workspace_invitations"."revoked_at" IS NULL;--> statement-breakpoint
CREATE INDEX "workspace_invitations_workspace_created_idx" ON "workspace_invitations" USING btree ("workspace_id","created_at");--> statement-breakpoint
CREATE INDEX "workspace_invitations_project_created_idx" ON "workspace_invitations" USING btree ("project_id","created_at");--> statement-breakpoint
CREATE INDEX "workspace_invitations_normalized_email_idx" ON "workspace_invitations" USING btree ("normalized_email");--> statement-breakpoint
CREATE INDEX "workspace_invitations_expires_at_idx" ON "workspace_invitations" USING btree ("expires_at");