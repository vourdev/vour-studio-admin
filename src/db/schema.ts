import {
  pgTable,
  serial,
  varchar,
  integer,
  numeric,
  timestamp,
  boolean,
  jsonb,
} from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name').notNull(),
  email: varchar('email').notNull(),
  salt: varchar('salt'),
  hash: varchar('hash'),
  resetPasswordToken: varchar('reset_password_token'),
  resetPasswordExpiration: timestamp('reset_password_expiration', { withTimezone: true }),
  loginAttempts: numeric('login_attempts').default('0'),
  lockUntil: timestamp('lock_until', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const usersRoles = pgTable('users_roles', {
  id: serial('id').primaryKey(),
  order: integer('order').notNull(),
  parentId: integer('parent_id').notNull(),
  value: varchar('value'),
})

export const usersPermissions = pgTable('users_permissions', {
  id: varchar('id').primaryKey(),
  order: integer('_order').notNull(),
  parentId: integer('_parent_id').notNull(),
  collection: varchar('collection').notNull(),
  canRead: boolean('can_read').default(true),
  canWrite: boolean('can_write').default(false),
})

export const media = pgTable('media', {
  id: serial('id').primaryKey(),
  alt: varchar('alt').notNull(),
  url: varchar('url'),
  thumbnailURL: varchar('thumbnail_u_r_l'),
  filename: varchar('filename'),
  mimeType: varchar('mime_type'),
  filesize: numeric('filesize'),
  width: numeric('width'),
  height: numeric('height'),
  focalX: numeric('focal_x'),
  focalY: numeric('focal_y'),
  sizesCardUrl: varchar('sizes_card_url'),
  sizesCardWidth: numeric('sizes_card_width'),
  sizesCardHeight: numeric('sizes_card_height'),
  sizesCardMimeType: varchar('sizes_card_mime_type'),
  sizesCardFilesize: numeric('sizes_card_filesize'),
  sizesCardFilename: varchar('sizes_card_filename'),
  sizesOgUrl: varchar('sizes_og_url'),
  sizesOgWidth: numeric('sizes_og_width'),
  sizesOgHeight: numeric('sizes_og_height'),
  sizesOgMimeType: varchar('sizes_og_mime_type'),
  sizesOgFilesize: numeric('sizes_og_filesize'),
  sizesOgFilename: varchar('sizes_og_filename'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  title: varchar('title'),
  slug: varchar('slug'),
  description: varchar('description'),
  category: varchar('category').default('Dev Notes'),
  date: timestamp('date', { withTimezone: true }),
  readingMinutes: numeric('reading_minutes').default('5'),
  imageId: integer('image_id'),
  content: jsonb('content'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  status: varchar('_status').default('draft'),
})

export const postsRelated = pgTable('posts_related', {
  id: varchar('id').primaryKey(),
  order: integer('_order').notNull(),
  parentId: integer('_parent_id').notNull(),
  label: varchar('label'),
  href: varchar('href'),
})

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  name: varchar('name').notNull(),
  slug: varchar('slug').notNull(),
  category: varchar('category').notNull(),
  tagline: varchar('tagline').notNull(),
  price: numeric('price'),
  status: varchar('status').default('soon'),
  imageId: integer('image_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const productsFeatures = pgTable('products_features', {
  id: varchar('id').primaryKey(),
  order: integer('_order').notNull(),
  parentId: integer('_parent_id').notNull(),
  feature: varchar('feature').notNull(),
})

export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  name: varchar('name').notNull(),
  slug: varchar('slug').notNull(),
  industry: varchar('industry'),
  year: varchar('year'),
  imageId: integer('image_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const projectsTechnology = pgTable('projects_technology', {
  id: varchar('id').primaryKey(),
  order: integer('_order').notNull(),
  parentId: integer('_parent_id').notNull(),
  technology: varchar('tech').notNull(),
})

export const leads = pgTable('leads', {
  id: serial('id').primaryKey(),
  name: varchar('name').notNull(),
  email: varchar('email').notNull(),
  whatsapp: varchar('whatsapp'),
  message: varchar('message').notNull(),
  sourcePage: varchar('source_page').default('/contact'),
  status: varchar('status').default('new'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const newsletterSubscribers = pgTable('newsletter_subscribers', {
  id: serial('id').primaryKey(),
  email: varchar('email').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const payloadKv = pgTable('payload_kv', {
  id: serial('id').primaryKey(),
  key: varchar('key').notNull(),
  data: jsonb('data').notNull(),
})
