
import { z } from 'zod';

// Pterodactyl connection schema
export const pterodactylConnectionSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  panel_url: z.string().url(),
  api_key: z.string(),
  name: z.string(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type PterodactylConnection = z.infer<typeof pterodactylConnectionSchema>;

// Server template schema
export const serverTemplateSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  language: z.enum(['python', 'nodejs']),
  version: z.string(),
  egg_id: z.number(),
  docker_image: z.string(),
  startup_command: z.string(),
  environment_variables: z.record(z.string()).nullable(),
  memory: z.number().int(),
  disk: z.number().int(),
  cpu: z.number().int(),
  is_active: z.boolean(),
  created_at: z.coerce.date()
});

export type ServerTemplate = z.infer<typeof serverTemplateSchema>;

// Created server schema
export const createdServerSchema = z.object({
  id: z.number(),
  connection_id: z.number(),
  template_id: z.number(),
  pterodactyl_server_id: z.number(),
  server_name: z.string(),
  server_url: z.string().url(),
  status: z.enum(['creating', 'active', 'failed', 'deleted']),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type CreatedServer = z.infer<typeof createdServerSchema>;

// Input schemas
export const createConnectionInputSchema = z.object({
  panel_url: z.string().url(),
  api_key: z.string().min(1),
  name: z.string().min(1)
});

export type CreateConnectionInput = z.infer<typeof createConnectionInputSchema>;

export const updateConnectionInputSchema = z.object({
  id: z.number(),
  panel_url: z.string().url().optional(),
  api_key: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  is_active: z.boolean().optional()
});

export type UpdateConnectionInput = z.infer<typeof updateConnectionInputSchema>;

export const createServerInputSchema = z.object({
  connection_id: z.number(),
  template_id: z.number(),
  server_name: z.string().min(1)
});

export type CreateServerInput = z.infer<typeof createServerInputSchema>;

export const createTemplateInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable(),
  language: z.enum(['python', 'nodejs']),
  version: z.string().min(1),
  egg_id: z.number(),
  docker_image: z.string().min(1),
  startup_command: z.string().min(1),
  environment_variables: z.record(z.string()).nullable(),
  memory: z.number().int().positive(),
  disk: z.number().int().positive(),
  cpu: z.number().int().positive()
});

export type CreateTemplateInput = z.infer<typeof createTemplateInputSchema>;

export const updateTemplateInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  language: z.enum(['python', 'nodejs']).optional(),
  version: z.string().min(1).optional(),
  egg_id: z.number().optional(),
  docker_image: z.string().min(1).optional(),
  startup_command: z.string().min(1).optional(),
  environment_variables: z.record(z.string()).nullable().optional(),
  memory: z.number().int().positive().optional(),
  disk: z.number().int().positive().optional(),
  cpu: z.number().int().positive().optional(),
  is_active: z.boolean().optional()
});

export type UpdateTemplateInput = z.infer<typeof updateTemplateInputSchema>;
