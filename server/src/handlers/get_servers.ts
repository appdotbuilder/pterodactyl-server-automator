
import { db } from '../db';
import { createdServersTable, pterodactylConnectionsTable, serverTemplatesTable } from '../db/schema';
import { type CreatedServer } from '../schema';
import { eq } from 'drizzle-orm';

export const getServers = async (): Promise<CreatedServer[]> => {
  try {
    // Query servers with joins to get connection and template details
    const results = await db.select()
      .from(createdServersTable)
      .innerJoin(
        pterodactylConnectionsTable,
        eq(createdServersTable.connection_id, pterodactylConnectionsTable.id)
      )
      .innerJoin(
        serverTemplatesTable,
        eq(createdServersTable.template_id, serverTemplatesTable.id)
      )
      .execute();

    // Map the joined results to the expected CreatedServer format
    return results.map(result => ({
      id: result.created_servers.id,
      connection_id: result.created_servers.connection_id,
      template_id: result.created_servers.template_id,
      pterodactyl_server_id: result.created_servers.pterodactyl_server_id,
      server_name: result.created_servers.server_name,
      server_url: result.created_servers.server_url,
      status: result.created_servers.status,
      created_at: result.created_servers.created_at,
      updated_at: result.created_servers.updated_at
    }));
  } catch (error) {
    console.error('Failed to fetch servers:', error);
    throw error;
  }
};
