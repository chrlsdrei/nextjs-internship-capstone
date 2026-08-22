CREATE TYPE "public"."notification_email_delivery_status" AS ENUM('pending', 'sending', 'sent', 'failed', 'skipped');--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "email_delivery_status" "notification_email_delivery_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "email_delivery_attempt" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "email_sent_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "email_delivery_error_code" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_notifications_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
UPDATE "notifications"
SET "email_delivery_status" = 'sent', "email_sent_at" = "created_at"
WHERE "type" IN ('workspace_invitation', 'project_invitation');--> statement-breakpoint
CREATE INDEX "notifications_email_delivery_idx" ON "notifications" USING btree ("email_delivery_status","created_at");--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_email_delivery_attempt_nonnegative" CHECK ("notifications"."email_delivery_attempt" >= 0);
