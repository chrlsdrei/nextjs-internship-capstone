CREATE TYPE "public"."account_status" AS ENUM('active', 'suspended', 'deleted');--> statement-breakpoint
CREATE TYPE "public"."system_role" AS ENUM('user', 'super_admin');--> statement-breakpoint
CREATE TYPE "public"."workspace_member_role" AS ENUM('admin', 'member');--> statement-breakpoint
CREATE TYPE "public"."workspace_status" AS ENUM('active', 'suspended', 'deleted');--> statement-breakpoint
CREATE TABLE "workspace_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "workspace_member_role" DEFAULT 'member' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"removed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workspace_members_id_workspace_unique" UNIQUE("id","workspace_id")
);
--> statement-breakpoint
CREATE TABLE "workspace_settings" (
	"workspace_id" uuid PRIMARY KEY NOT NULL,
	"members_can_create_projects" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"status" "workspace_status" DEFAULT 'active' NOT NULL,
	"owner_workspace_member_id" uuid NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "normalized_email" text;--> statement-breakpoint
UPDATE "users" SET "normalized_email" = lower(trim("email"));--> statement-breakpoint
DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM "users"
		GROUP BY "normalized_email"
		HAVING count(*) > 1
	) THEN
		RAISE EXCEPTION 'Cannot enforce normalized user email uniqueness while case-insensitive duplicates exist';
	END IF;
END
$$;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "normalized_email" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "system_role" "system_role" DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "account_status" "account_status" DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_settings" ADD CONSTRAINT "workspace_settings_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_owner_membership_fk" FOREIGN KEY ("owner_workspace_member_id","id") REFERENCES "public"."workspace_members"("id","workspace_id") ON DELETE no action ON UPDATE no action DEFERRABLE INITIALLY DEFERRED;--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_members_active_user_workspace_unique" ON "workspace_members" USING btree ("workspace_id","user_id") WHERE "workspace_members"."removed_at" is null;--> statement-breakpoint
CREATE INDEX "workspace_members_workspace_id_idx" ON "workspace_members" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "workspace_members_user_id_idx" ON "workspace_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "workspaces_owner_workspace_member_id_idx" ON "workspaces" USING btree ("owner_workspace_member_id");--> statement-breakpoint
CREATE INDEX "workspaces_status_idx" ON "workspaces" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "users_normalized_email_unique" ON "users" USING btree ("normalized_email");--> statement-breakpoint
CREATE FUNCTION "enforce_workspace_owner_membership_active"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM "workspace_members"
		WHERE "id" = NEW."owner_workspace_member_id"
			AND "workspace_id" = NEW."id"
			AND "removed_at" IS NULL
	) THEN
		RAISE EXCEPTION 'Workspace % owner membership % must be active and belong to the workspace', NEW."id", NEW."owner_workspace_member_id"
			USING ERRCODE = '23514';
	END IF;

	RETURN NEW;
END
$$;--> statement-breakpoint
CREATE CONSTRAINT TRIGGER "workspaces_owner_membership_active"
AFTER INSERT OR UPDATE OF "owner_workspace_member_id", "id" ON "workspaces"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION "enforce_workspace_owner_membership_active"();--> statement-breakpoint
CREATE FUNCTION "prevent_current_workspace_owner_removal"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
	IF NEW."removed_at" IS NOT NULL
		AND OLD."removed_at" IS DISTINCT FROM NEW."removed_at"
		AND EXISTS (
			SELECT 1
			FROM "workspaces"
			WHERE "id" = NEW."workspace_id"
				AND "owner_workspace_member_id" = NEW."id"
		)
	THEN
		RAISE EXCEPTION 'Current workspace owner membership % cannot be removed before ownership transfer', NEW."id"
			USING ERRCODE = '23514';
	END IF;

	RETURN NEW;
END
$$;--> statement-breakpoint
CREATE CONSTRAINT TRIGGER "workspace_members_current_owner_removal"
AFTER UPDATE OF "removed_at" ON "workspace_members"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION "prevent_current_workspace_owner_removal"();
