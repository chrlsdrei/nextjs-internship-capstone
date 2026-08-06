DO $$
BEGIN
	IF EXISTS (SELECT 1 FROM "projects" LIMIT 1)
		OR EXISTS (SELECT 1 FROM "project_members" LIMIT 1)
		OR EXISTS (SELECT 1 FROM "lists" LIMIT 1)
		OR EXISTS (SELECT 1 FROM "tasks" LIMIT 1)
		OR EXISTS (SELECT 1 FROM "comments" LIMIT 1)
	THEN
		RAISE EXCEPTION 'Project workspace cutover requires the guarded development project-data reset first';
	END IF;
END
$$;--> statement-breakpoint
DROP TABLE "comments";--> statement-breakpoint
DROP TABLE "tasks";--> statement-breakpoint
DROP TABLE "lists";--> statement-breakpoint
DROP TABLE "project_members";--> statement-breakpoint
DROP TABLE "projects";--> statement-breakpoint
DROP TYPE "public"."project_member_role";
