CREATE TABLE "guidelines_content" (
	"id" serial PRIMARY KEY NOT NULL,
	"context_id" integer NOT NULL,
	"content" text DEFAULT '' NOT NULL,
);
--> statement-breakpoint
CREATE TABLE "guidelines_contexts" (
	"id" serial PRIMARY KEY NOT NULL,
	"repository_id" integer NOT NULL,
	"name" text NOT NULL,
	"prompt" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "repositories" (
	"id" serial PRIMARY KEY NOT NULL,
	"origin" text NOT NULL,
	CONSTRAINT "repositories_origin_unique" UNIQUE("origin")
);
--> statement-breakpoint
ALTER TABLE "guidelines_content" ADD CONSTRAINT "guidelines_content_context_id_guidelines_contexts_id_fk" FOREIGN KEY ("context_id") REFERENCES "public"."guidelines_contexts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guidelines_contexts" ADD CONSTRAINT "guidelines_contexts_repository_id_repositories_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE no action ON UPDATE no action;