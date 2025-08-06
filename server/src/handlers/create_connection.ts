
import { db } from '../db';
import { pterodactylConnectionsTable } from '../db/schema';
import { type CreateConnectionInput, type PterodactylConnection } from '../schema';

export const createConnection = async (input: CreateConnectionInput): Promise<PterodactylConnection> => {
  try {
    // Insert connection record
    const result = await db.insert(pterodactylConnectionsTable)
      .values({
        user_id: 'default_user', // Placeholder for user authentication
        panel_url: input.panel_url,
        api_key: input.api_key,
        name: input.name,
        is_active: true // Default value from schema
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Connection creation failed:', error);
    throw error;
  }
};
