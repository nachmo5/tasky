CREATE TABLE "completed_occurrences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"task_template_id" uuid NOT NULL,
	"start_date" timestamp NOT NULL,
	"completed_at" timestamp with time zone NOT NULL,
	"is_cancelled" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"priority" smallint DEFAULT 1 NOT NULL,
	"estimated_mn" double precision NOT NULL,
	"overdue_after" jsonb,
	"first_occurrence_start_date" timestamp NOT NULL,
	"next_occurrence_every" jsonb,
	"tags" jsonb DEFAULT '{}',
	"pinned_at" timestamp with time zone,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" text,
	"username" text NOT NULL UNIQUE,
	"password_hash" text NOT NULL
);
--> statement-breakpoint
CREATE INDEX "completed_occurrences_task_template_id_idx" ON "completed_occurrences" ("task_template_id","start_date");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" ("user_id");--> statement-breakpoint
ALTER TABLE "completed_occurrences" ADD CONSTRAINT "completed_occurrences_task_template_id_task_templates_id_fkey" FOREIGN KEY ("task_template_id") REFERENCES "task_templates"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "task_templates" ADD CONSTRAINT "task_templates_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;