
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pterodactylConnectionsTable } from '../db/schema';
import { type CreateConnectionInput } from '../schema';
import { getConnections } from '../handlers/get_connections';

// Test connection data
const testConnection1: CreateConnectionInput = {
  panel_url: 'https://panel1.example.com',
  api_key: 'test-api-key-1',
  name: 'Test Connection 1'
};

const testConnection2: CreateConnectionInput = {
  panel_url: 'https://panel2.example.com',
  api_key: 'test-api-key-2',
  name: 'Test Connection 2'
};

describe('getConnections', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no connections exist', async () => {
    const result = await getConnections();
    
    expect(result).toHaveLength(0);
  });

  it('should return all active connections', async () => {
    // Create test connections
    await db.insert(pterodactylConnectionsTable)
      .values([
        {
          user_id: 'user1',
          panel_url: testConnection1.panel_url,
          api_key: testConnection1.api_key,
          name: testConnection1.name,
          is_active: true
        },
        {
          user_id: 'user2',
          panel_url: testConnection2.panel_url,
          api_key: testConnection2.api_key,
          name: testConnection2.name,
          is_active: true
        }
      ])
      .execute();

    const result = await getConnections();

    expect(result).toHaveLength(2);
    expect(result[0].name).toEqual('Test Connection 1');
    expect(result[0].panel_url).toEqual('https://panel1.example.com');
    expect(result[0].is_active).toBe(true);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);

    expect(result[1].name).toEqual('Test Connection 2');
    expect(result[1].panel_url).toEqual('https://panel2.example.com');
    expect(result[1].is_active).toBe(true);
  });

  it('should only return active connections', async () => {
    // Create both active and inactive connections
    await db.insert(pterodactylConnectionsTable)
      .values([
        {
          user_id: 'user1',
          panel_url: testConnection1.panel_url,
          api_key: testConnection1.api_key,
          name: testConnection1.name,
          is_active: true
        },
        {
          user_id: 'user2',
          panel_url: testConnection2.panel_url,
          api_key: testConnection2.api_key,
          name: testConnection2.name,
          is_active: false
        }
      ])
      .execute();

    const result = await getConnections();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Test Connection 1');
    expect(result[0].is_active).toBe(true);
  });

  it('should return connections with all required fields', async () => {
    await db.insert(pterodactylConnectionsTable)
      .values({
        user_id: 'test-user',
        panel_url: testConnection1.panel_url,
        api_key: testConnection1.api_key,
        name: testConnection1.name,
        is_active: true
      })
      .execute();

    const result = await getConnections();

    expect(result).toHaveLength(1);
    
    const connection = result[0];
    expect(connection.id).toBeDefined();
    expect(typeof connection.id).toBe('number');
    expect(connection.user_id).toBeDefined();
    expect(typeof connection.user_id).toBe('string');
    expect(connection.panel_url).toEqual(testConnection1.panel_url);
    expect(connection.api_key).toEqual(testConnection1.api_key);
    expect(connection.name).toEqual(testConnection1.name);
    expect(connection.is_active).toBe(true);
    expect(connection.created_at).toBeInstanceOf(Date);
    expect(connection.updated_at).toBeInstanceOf(Date);
  });
});
