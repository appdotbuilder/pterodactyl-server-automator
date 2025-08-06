
import { db } from '../db';
import { createdServersTable } from '../db/schema';
import { type CreatedServer } from '../schema';
import { eq } from 'drizzle-orm';

export async function getServerById(serverId: number): Promise<CreatedServer | null> {
  try {
    const results = await db.select()
      .from(createdServersTable)
      .where(eq(createdServersTable.id, serverId))
      .limit(1)
      .execute();

    if (results.length === 0) {
      return null;
    }

    const server = results[0];
    return {
      ...server,
      id: server.id,
      connection_id: server.connection_id,
      template_id: server.template_id,
      pterodactyl_server_id: server.pterodactyl_server_id,
      server_name: server.server_name,
      server_url: server.server_url,
      status: server.status,
      created_at: server.created_at,
      updated_at: server.updated_at
    };
  } catch (error) {
    console.error('Server retrieval failed:', error);
    throw error;
  }
}
