CREATE TABLE "leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"email" varchar NOT NULL,
	"whatsapp" varchar,
	"message" varchar NOT NULL,
	"source_page" varchar DEFAULT '/contact',
	"status" varchar DEFAULT 'new',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media" (
	"id" serial PRIMARY KEY NOT NULL,
	"alt" varchar NOT NULL,
	"url" varchar,
	"thumbnail_u_r_l" varchar,
	"filename" varchar,
	"mime_type" varchar,
	"filesize" numeric,
	"width" numeric,
	"height" numeric,
	"focal_x" numeric,
	"focal_y" numeric,
	"sizes_card_url" varchar,
	"sizes_card_width" numeric,
	"sizes_card_height" numeric,
	"sizes_card_mime_type" varchar,
	"sizes_card_filesize" numeric,
	"sizes_card_filename" varchar,
	"sizes_og_url" varchar,
	"sizes_og_width" numeric,
	"sizes_og_height" numeric,
	"sizes_og_mime_type" varchar,
	"sizes_og_filesize" numeric,
	"sizes_og_filename" varchar,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "newsletter_subscribers" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payload_kv" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar NOT NULL,
	"data" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar,
	"slug" varchar,
	"description" varchar,
	"category" varchar DEFAULT 'Dev Notes',
	"date" timestamp with time zone,
	"reading_minutes" numeric DEFAULT '5',
	"image_id" integer,
	"content" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"_status" varchar DEFAULT 'draft'
);
--> statement-breakpoint
CREATE TABLE "posts_related" (
	"id" varchar PRIMARY KEY NOT NULL,
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"label" varchar,
	"href" varchar
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"slug" varchar NOT NULL,
	"category" varchar NOT NULL,
	"tagline" varchar NOT NULL,
	"price" numeric,
	"status" varchar DEFAULT 'soon',
	"image_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products_features" (
	"id" varchar PRIMARY KEY NOT NULL,
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"feature" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"slug" varchar NOT NULL,
	"industry" varchar,
	"year" varchar,
	"image_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects_technology" (
	"id" varchar PRIMARY KEY NOT NULL,
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"tech" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"email" varchar NOT NULL,
	"salt" varchar,
	"hash" varchar,
	"reset_password_token" varchar,
	"reset_password_expiration" timestamp with time zone,
	"login_attempts" numeric DEFAULT '0',
	"lock_until" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users_permissions" (
	"id" varchar PRIMARY KEY NOT NULL,
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"collection" varchar NOT NULL,
	"can_read" boolean DEFAULT true,
	"can_write" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "users_roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"order" integer NOT NULL,
	"parent_id" integer NOT NULL,
	"value" varchar
);
