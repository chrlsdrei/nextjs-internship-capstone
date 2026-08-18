CREATE OR REPLACE FUNCTION "public"."reserve_ai_usage"(
	"p_workspace_id" uuid,
	"p_user_id" uuid,
	"p_project_id" uuid,
	"p_quota_key" text,
	"p_action" text,
	"p_request_key" text,
	"p_model" text,
	"p_limit" integer,
	"p_scope" text,
	"p_period_starts_at" timestamptz,
	"p_period_ends_at" timestamptz
)
RETURNS TABLE (
	"reservation_id" uuid,
	"reservation_status" "public"."ai_usage_status",
	"reservation_result_resource_id" uuid,
	"reservation_existing" boolean
)
LANGUAGE plpgsql
AS $$
DECLARE
	"current_usage" integer;
	"lock_key" text;
BEGIN
	IF "p_scope" NOT IN ('user', 'workspace') THEN
		RAISE EXCEPTION 'Invalid AI quota scope';
	END IF;

	"lock_key" := "p_scope" || ':' ||
		CASE WHEN "p_scope" = 'user' THEN "p_user_id"::text ELSE "p_workspace_id"::text END || ':' ||
		"p_quota_key" || ':' || "p_period_starts_at"::text;
	PERFORM pg_advisory_xact_lock(hashtextextended("lock_key", 0));

	RETURN QUERY
	SELECT "logs"."id", "logs"."status", "logs"."result_resource_id", true
	FROM "public"."ai_usage_logs" AS "logs"
	WHERE "logs"."user_id" = "p_user_id" AND "logs"."request_key" = "p_request_key"
	LIMIT 1;
	IF FOUND THEN
		RETURN;
	END IF;

	SELECT COUNT(*)::integer INTO "current_usage"
	FROM "public"."ai_usage_logs" AS "logs"
	WHERE (("p_scope" = 'user' AND "logs"."user_id" = "p_user_id") OR
		("p_scope" = 'workspace' AND "logs"."workspace_id" = "p_workspace_id"))
		AND "logs"."quota_key" = "p_quota_key"
		AND "logs"."status" IN ('pending', 'succeeded')
		AND "logs"."created_at" >= "p_period_starts_at"
		AND "logs"."created_at" < "p_period_ends_at";

	IF "current_usage" >= "p_limit" THEN
		RETURN;
	END IF;

	RETURN QUERY
	INSERT INTO "public"."ai_usage_logs" (
		"workspace_id", "user_id", "project_id", "quota_key", "action", "request_key", "status",
		"model", "period_starts_at", "period_ends_at"
	)
	VALUES (
		"p_workspace_id", "p_user_id", "p_project_id", "p_quota_key", "p_action", "p_request_key", 'pending',
		"p_model", "p_period_starts_at", "p_period_ends_at"
	)
	RETURNING "ai_usage_logs"."id", "ai_usage_logs"."status", "ai_usage_logs"."result_resource_id", false;
END;
$$;
