
import { db } from '../db';
import { createdServersTable } from '../db/schema';
import { type CreatedServer } from '../schema';
import { eq } from 'drizzle-orm';

export const updateServerStatus = async (
  serverId: number,
  status: 'creating' | 'active' | 'failed' | 'deleted'
): Promise<CreatedServer> => {
  try {
    // Update the server status and updated_at timestamp
    const result = await db.update(createdServersTable)
      .set({
        status: status,
        updated_at: new Date()
      })
      .where(eq(createdServersTable.id, serverId))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Server with id ${serverId} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Server status update failed:', error);
    throw error;
  }
};
