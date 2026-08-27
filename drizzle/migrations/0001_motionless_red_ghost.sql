CREATE TABLE "blog_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"remote_topic_id" varchar,
	"title" varchar NOT NULL,
	"slug" varchar NOT NULL,
	"content" text NOT NULL,
	"category" varchar DEFAULT 'Dev Notes',
	"reading_minutes" numeric DEFAULT '5',
	"status" varchar DEFAULT 'published',
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "posts_related" ADD COLUMN "related_post_id" integer;