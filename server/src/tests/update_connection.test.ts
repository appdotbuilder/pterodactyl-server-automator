
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pterodactylConnectionsTable } from '../db/schema';
import { type UpdateConnectionInput } from '../schema';
import { updateConnection } from '../handlers/update_connection';
import { eq } from 'drizzle-orm';

describe('updateConnection', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update connection fields', async () => {
    // Create initial connection
    const initialConnection = await db.insert(pterodactylConnectionsTable)
      .values({
        user_id: 'test_user',
        panel_url: 'https://panel.example.com',
        api_key: 'initial_key',
        name: 'Initial Connection',
        is_active: true
      })
      .returning()
      .execute();

    const connectionId = initialConnection[0].id;

    // Update connection
    const updateInput: UpdateConnectionInput = {
      id: connectionId,
      panel_url: 'https://updated-panel.example.com',
      api_key: 'updated_key',
      name: 'Updated Connection',
      is_active: false
    };

    const result = await updateConnection(updateInput);

    // Verify updated fields
    expect(result.id).toEqual(connectionId);
    expect(result.panel_url).toEqual('https://updated-panel.example.com');
    expect(result.api_key).toEqual('updated_key');
    expect(result.name).toEqual('Updated Connection');
    expect(result.is_active).toEqual(false);
    expect(result.user_id).toEqual('test_user');
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > result.created_at).toBe(true);
  });

  it('should update only specified fields', async () => {
    // Create initial connection
    const initialConnection = await db.insert(pterodactylConnectionsTable)
      .values({
        user_id: 'test_user',
        panel_url: 'https://panel.example.com',
        api_key: 'initial_key',
        name: 'Initial Connection',
        is_active: true
      })
      .returning()
      .execute();

    const connectionId = initialConnection[0].id;

    // Update only name
    const updateInput: UpdateConnectionInput = {
      id: connectionId,
      name: 'Partially Updated Connection'
    };

    const result = await updateConnection(updateInput);

    // Verify only name was updated, other fields unchanged
    expect(result.id).toEqual(connectionId);
    expect(result.name).toEqual('Partially Updated Connection');
    expect(result.panel_url).toEqual('https://panel.example.com'); // Unchanged
    expect(result.api_key).toEqual('initial_key'); // Unchanged
    expect(result.is_active).toEqual(true); // Unchanged
    expect(result.user_id).toEqual('test_user'); // Unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save updated connection to database', async () => {
    // Create initial connection
    const initialConnection = await db.insert(pterodactylConnectionsTable)
      .values({
        user_id: 'test_user',
        panel_url: 'https://panel.example.com',
        api_key: 'initial_key',
        name: 'Initial Connection',
        is_active: true
      })
      .returning()
      .execute();

    const connectionId = initialConnection[0].id;

    // Update connection
    const updateInput: UpdateConnectionInput = {
      id: connectionId,
      panel_url: 'https://database-check.example.com',
      name: 'Database Check Connection'
    };

    await updateConnection(updateInput);

    // Query database directly to verify changes persisted
    const connections = await db.select()
      .from(pterodactylConnectionsTable)
      .where(eq(pterodactylConnectionsTable.id, connectionId))
      .execute();

    expect(connections).toHaveLength(1);
    expect(connections[0].name).toEqual('Database Check Connection');
    expect(connections[0].panel_url).toEqual('https://database-check.example.com');
    expect(connections[0].api_key).toEqual('initial_key'); // Should remain unchanged
  });

  it('should throw error when connection does not exist', async () => {
    const updateInput: UpdateConnectionInput = {
      id: 999999,
      name: 'Non-existent Connection'
    };

    expect(updateConnection(updateInput)).rejects.toThrow(/connection with id 999999 not found/i);
  });
});
