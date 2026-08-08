import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_users_permissions_collection" AS ENUM('posts', 'products', 'projects', 'media', 'leads', 'newsletter-subscribers', 'site-settings');
  CREATE TABLE "users_permissions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"collection" "enum_users_permissions_collection" NOT NULL,
  	"can_read" boolean DEFAULT true,
  	"can_write" boolean DEFAULT false
  );
  
  ALTER TABLE "users_permissions" ADD CONSTRAINT "users_permissions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_permissions_order_idx" ON "users_permissions" USING btree ("_order");
  CREATE INDEX "users_permissions_parent_id_idx" ON "users_permissions" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_permissions" CASCADE;
  DROP TYPE "public"."enum_users_permissions_collection";`)
}
