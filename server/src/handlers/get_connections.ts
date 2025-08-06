
import { db } from '../db';
import { pterodactylConnectionsTable } from '../db/schema';
import { type PterodactylConnection } from '../schema';
import { eq } from 'drizzle-orm';

export const getConnections = async (): Promise<PterodactylConnection[]> => {
  try {
    // Query all active connections
    const results = await db.select()
      .from(pterodactylConnectionsTable)
      .where(eq(pterodactylConnectionsTable.is_active, true))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch connections:', error);
    throw error;
  }
};
