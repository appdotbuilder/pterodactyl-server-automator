
import { db } from '../db';
import { createdServersTable, pterodactylConnectionsTable, serverTemplatesTable } from '../db/schema';
import { type CreateServerInput, type CreatedServer } from '../schema';
import { eq, and } from 'drizzle-orm';

export const createServer = async (input: CreateServerInput): Promise<CreatedServer> => {
  try {
    // Validate that the connection exists and is active
    const connections = await db.select()
      .from(pterodactylConnectionsTable)
      .where(
        and(
          eq(pterodactylConnectionsTable.id, input.connection_id),
          eq(pterodactylConnectionsTable.is_active, true)
        )
      )
      .execute();

    if (connections.length === 0) {
      throw new Error('Connection not found or inactive');
    }

    // Validate that the template exists and is active
    const templates = await db.select()
      .from(serverTemplatesTable)
      .where(
        and(
          eq(serverTemplatesTable.id, input.template_id),
          eq(serverTemplatesTable.is_active, true)
        )
      )
      .execute();

    if (templates.length === 0) {
      throw new Error('Template not found or inactive');
    }

    const connection = connections[0];
    const template = templates[0];

    // In a real implementation, here we would:
    // 1. Make API call to Pterodactyl Panel to create the server
    // 2. Get the pterodactyl_server_id from the API response
    // For now, we'll simulate this with a mock ID
    const pterodactylServerId = Math.floor(Math.random() * 10000) + 1000;

    // Create server record in database
    const result = await db.insert(createdServersTable)
      .values({
        connection_id: input.connection_id,
        template_id: input.template_id,
        pterodactyl_server_id: pterodactylServerId,
        server_name: input.server_name,
        server_url: `${connection.panel_url}/server/${pterodactylServerId}`,
        status: 'creating'
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Server creation failed:', error);
    throw error;
  }
};
