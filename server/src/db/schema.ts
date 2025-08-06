
import { serial, text, pgTable, timestamp, integer, boolean, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const languageEnum = pgEnum('language', ['python', 'nodejs']);
export const serverStatusEnum = pgEnum('server_status', ['creating', 'active', 'failed', 'deleted']);

// Pterodactyl connections table
export const pterodactylConnectionsTable = pgTable('pterodactyl_connections', {
  id: serial('id').primaryKey(),
  user_id: text('user_id').notNull(), // For future user authentication
  panel_url: text('panel_url').notNull(),
  api_key: text('api_key').notNull(),
  name: text('name').notNull(),
  is_active: boolean('is_active').default(true).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Server templates table
export const serverTemplatesTable = pgTable('server_templates', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'), // Nullable
  language: languageEnum('language').notNull(),
  version: text('version').notNull(),
  egg_id: integer('egg_id').notNull(),
  docker_image: text('docker_image').notNull(),
  startup_command: text('startup_command').notNull(),
  environment_variables: jsonb('environment_variables'), // Nullable JSON object
  memory: integer('memory').notNull(), // MB
  disk: integer('disk').notNull(), // MB
  cpu: integer('cpu').notNull(), // Percentage
  is_active: boolean('is_active').default(true).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Created servers table
export const createdServersTable = pgTable('created_servers', {
  id: serial('id').primaryKey(),
  connection_id: integer('connection_id').notNull(),
  template_id: integer('template_id').notNull(),
  pterodactyl_server_id: integer('pterodactyl_server_id').notNull(),
  server_name: text('server_name').notNull(),
  server_url: text('server_url').notNull(),
  status: serverStatusEnum('status').default('creating').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Relations
export const pterodactylConnectionsRelations = relations(pterodactylConnectionsTable, ({ many }) => ({
  servers: many(createdServersTable)
}));

export const serverTemplatesRelations = relations(serverTemplatesTable, ({ many }) => ({
  servers: many(createdServersTable)
}));

export const createdServersRelations = relations(createdServersTable, ({ one }) => ({
  connection: one(pterodactylConnectionsTable, {
    fields: [createdServersTable.connection_id],
    references: [pterodactylConnectionsTable.id]
  }),
  template: one(serverTemplatesTable, {
    fields: [createdServersTable.template_id],
    references: [serverTemplatesTable.id]
  })
}));

// TypeScript types
export type PterodactylConnection = typeof pterodactylConnectionsTable.$inferSelect;
export type NewPterodactylConnection = typeof pterodactylConnectionsTable.$inferInsert;
export type ServerTemplate = typeof serverTemplatesTable.$inferSelect;
export type NewServerTemplate = typeof serverTemplatesTable.$inferInsert;
export type CreatedServer = typeof createdServersTable.$inferSelect;
export type NewCreatedServer = typeof createdServersTable.$inferInsert;

// Export all tables for relations
export const tables = {
  pterodactylConnections: pterodactylConnectionsTable,
  serverTemplates: serverTemplatesTable,
  createdServers: createdServersTable
};
