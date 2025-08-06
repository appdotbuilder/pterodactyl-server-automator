
import { db } from '../db';
import { pterodactylConnectionsTable, createdServersTable } from '../db/schema';
import { type PterodactylConnection } from '../schema';
import { eq, and } from 'drizzle-orm';

export const deleteConnection = async (connectionId: number): Promise<{ success: boolean }> => {
  try {
    // Check if connection exists
    const existingConnection = await db.select()
      .from(pterodactylConnectionsTable)
      .where(eq(pterodactylConnectionsTable.id, connectionId))
      .execute();

    if (existingConnection.length === 0) {
      throw new Error(`Connection with ID ${connectionId} not found`);
    }

    // Check if connection is already inactive
    if (!existingConnection[0].is_active) {
      throw new Error(`Connection with ID ${connectionId} is already deleted`);
    }

    // Check for active servers using this connection
    const activeServers = await db.select()
      .from(createdServersTable)
      .where(
        and(
          eq(createdServersTable.connection_id, connectionId),
          eq(createdServersTable.status, 'active')
        )
      )
      .execute();

    if (activeServers.length > 0) {
      throw new Error(`Cannot delete connection: ${activeServers.length} active server(s) are using this connection`);
    }

    // Soft delete the connection by setting is_active to false
    await db.update(pterodactylConnectionsTable)
      .set({
        is_active: false,
        updated_at: new Date()
      })
      .where(eq(pterodactylConnectionsTable.id, connectionId))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Connection deletion failed:', error);
    throw error;
  }
};
