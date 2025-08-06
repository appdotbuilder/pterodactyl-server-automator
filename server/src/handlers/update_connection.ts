
import { db } from '../db';
import { pterodactylConnectionsTable } from '../db/schema';
import { type UpdateConnectionInput, type PterodactylConnection } from '../schema';
import { eq } from 'drizzle-orm';

export const updateConnection = async (input: UpdateConnectionInput): Promise<PterodactylConnection> => {
  try {
    // Check if connection exists
    const existingConnection = await db.select()
      .from(pterodactylConnectionsTable)
      .where(eq(pterodactylConnectionsTable.id, input.id))
      .execute();

    if (existingConnection.length === 0) {
      throw new Error(`Connection with id ${input.id} not found`);
    }

    // Update connection with provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.panel_url !== undefined) {
      updateData.panel_url = input.panel_url;
    }
    if (input.api_key !== undefined) {
      updateData.api_key = input.api_key;
    }
    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    if (input.is_active !== undefined) {
      updateData.is_active = input.is_active;
    }

    const result = await db.update(pterodactylConnectionsTable)
      .set(updateData)
      .where(eq(pterodactylConnectionsTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Connection update failed:', error);
    throw error;
  }
};
