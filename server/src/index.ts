
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  createConnectionInputSchema,
  updateConnectionInputSchema,
  createTemplateInputSchema,
  updateTemplateInputSchema,
  createServerInputSchema
} from './schema';

// Import handlers
import { createConnection } from './handlers/create_connection';
import { getConnections } from './handlers/get_connections';
import { updateConnection } from './handlers/update_connection';
import { deleteConnection } from './handlers/delete_connection';
import { createTemplate } from './handlers/create_template';
import { getTemplates } from './handlers/get_templates';
import { updateTemplate } from './handlers/update_template';
import { createServer } from './handlers/create_server';
import { getServers } from './handlers/get_servers';
import { getServerById } from './handlers/get_server_by_id';
import { updateServerStatus } from './handlers/update_server_status';
import { deleteServer } from './handlers/delete_server';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Pterodactyl connection routes
  createConnection: publicProcedure
    .input(createConnectionInputSchema)
    .mutation(({ input }) => createConnection(input)),
  
  getConnections: publicProcedure
    .query(() => getConnections()),
  
  updateConnection: publicProcedure
    .input(updateConnectionInputSchema)
    .mutation(({ input }) => updateConnection(input)),
  
  deleteConnection: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteConnection(input.id)),

  // Server template routes
  createTemplate: publicProcedure
    .input(createTemplateInputSchema)
    .mutation(({ input }) => createTemplate(input)),
  
  getTemplates: publicProcedure
    .query(() => getTemplates()),
  
  updateTemplate: publicProcedure
    .input(updateTemplateInputSchema)
    .mutation(({ input }) => updateTemplate(input)),

  // Server management routes
  createServer: publicProcedure
    .input(createServerInputSchema)
    .mutation(({ input }) => createServer(input)),
  
  getServers: publicProcedure
    .query(() => getServers()),
  
  getServerById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getServerById(input.id)),
  
  updateServerStatus: publicProcedure
    .input(z.object({ 
      id: z.number(),
      status: z.enum(['creating', 'active', 'failed', 'deleted'])
    }))
    .mutation(({ input }) => updateServerStatus(input.id, input.status)),
  
  deleteServer: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteServer(input.id)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
