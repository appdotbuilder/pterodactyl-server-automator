
import { db } from '../db';
import { createdServersTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function deleteServer(serverId: number): Promise<{ success: boolean }> {
  try {
    // Check if server exists
    const servers = await db.select()
      .from(createdServersTable)
      .where(eq(createdServersTable.id, serverId))
      .execute();

    if (servers.length === 0) {
      throw new Error('Server not found');
    }

    const server = servers[0];

    // Only allow deletion if server is not already deleted
    if (server.status === 'deleted') {
      throw new Error('Server is already deleted');
    }

    // Update server status to 'deleted' (soft delete approach)
    // In a real implementation, this would also make API call to Pterodactyl Panel
    await db.update(createdServersTable)
      .set({ 
        status: 'deleted',
        updated_at: new Date()
      })
      .where(eq(createdServersTable.id, serverId))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Server deletion failed:', error);
    throw error;
  }
}
