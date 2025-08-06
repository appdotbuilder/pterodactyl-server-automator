
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pterodactylConnectionsTable } from '../db/schema';
import { type CreateConnectionInput } from '../schema';
import { createConnection } from '../handlers/create_connection';
import { eq } from 'drizzle-orm';

// Test input
const testInput: CreateConnectionInput = {
  panel_url: 'https://panel.example.com',
  api_key: 'ptlc_test_api_key_12345',
  name: 'Test Panel Connection'
};

describe('createConnection', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a connection', async () => {
    const result = await createConnection(testInput);

    // Basic field validation
    expect(result.panel_url).toEqual('https://panel.example.com');
    expect(result.api_key).toEqual('ptlc_test_api_key_12345');
    expect(result.name).toEqual('Test Panel Connection');
    expect(result.user_id).toEqual('default_user');
    expect(result.is_active).toBe(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save connection to database', async () => {
    const result = await createConnection(testInput);

    // Query using proper drizzle syntax
    const connections = await db.select()
      .from(pterodactylConnectionsTable)
      .where(eq(pterodactylConnectionsTable.id, result.id))
      .execute();

    expect(connections).toHaveLength(1);
    expect(connections[0].panel_url).toEqual('https://panel.example.com');
    expect(connections[0].api_key).toEqual('ptlc_test_api_key_12345');
    expect(connections[0].name).toEqual('Test Panel Connection');
    expect(connections[0].user_id).toEqual('default_user');
    expect(connections[0].is_active).toBe(true);
    expect(connections[0].created_at).toBeInstanceOf(Date);
    expect(connections[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create multiple connections with different names', async () => {
    const input1 = { ...testInput, name: 'Panel 1' };
    const input2 = { ...testInput, name: 'Panel 2', panel_url: 'https://panel2.example.com' };

    const result1 = await createConnection(input1);
    const result2 = await createConnection(input2);

    expect(result1.id).not.toEqual(result2.id);
    expect(result1.name).toEqual('Panel 1');
    expect(result2.name).toEqual('Panel 2');
    expect(result1.panel_url).toEqual('https://panel.example.com');
    expect(result2.panel_url).toEqual('https://panel2.example.com');
  });
});
