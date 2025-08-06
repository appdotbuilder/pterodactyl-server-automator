
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pterodactylConnectionsTable, serverTemplatesTable, createdServersTable } from '../db/schema';
import { updateServerStatus } from '../handlers/update_server_status';
import { eq } from 'drizzle-orm';

describe('updateServerStatus', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update server status', async () => {
    // Create prerequisite data
    const connectionResult = await db.insert(pterodactylConnectionsTable)
      .values({
        user_id: 'test-user',
        panel_url: 'https://panel.example.com',
        api_key: 'test-key',
        name: 'Test Connection'
      })
      .returning()
      .execute();

    const templateResult = await db.insert(serverTemplatesTable)
      .values({
        name: 'Test Template',
        description: 'A test template',
        language: 'nodejs',
        version: '18',
        egg_id: 1,
        docker_image: 'node:18',
        startup_command: 'npm start',
        environment_variables: { NODE_ENV: 'production' },
        memory: 512,
        disk: 1024,
        cpu: 100
      })
      .returning()
      .execute();

    const serverResult = await db.insert(createdServersTable)
      .values({
        connection_id: connectionResult[0].id,
        template_id: templateResult[0].id,
        pterodactyl_server_id: 123,
        server_name: 'Test Server',
        server_url: 'https://panel.example.com/server/123',
        status: 'creating'
      })
      .returning()
      .execute();

    const originalUpdatedAt = serverResult[0].updated_at;

    // Update server status
    const result = await updateServerStatus(serverResult[0].id, 'active');

    // Verify result
    expect(result.id).toEqual(serverResult[0].id);
    expect(result.status).toEqual('active');
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > originalUpdatedAt).toBe(true);
    expect(result.server_name).toEqual('Test Server');
    expect(result.connection_id).toEqual(connectionResult[0].id);
  });

  it('should save updated status to database', async () => {
    // Create prerequisite data
    const connectionResult = await db.insert(pterodactylConnectionsTable)
      .values({
        user_id: 'test-user',
        panel_url: 'https://panel.example.com',
        api_key: 'test-key',
        name: 'Test Connection'
      })
      .returning()
      .execute();

    const templateResult = await db.insert(serverTemplatesTable)
      .values({
        name: 'Test Template',
        description: 'A test template',
        language: 'python',
        version: '3.11',
        egg_id: 2,
        docker_image: 'python:3.11',
        startup_command: 'python main.py',
        environment_variables: null,
        memory: 256,
        disk: 512,
        cpu: 50
      })
      .returning()
      .execute();

    const serverResult = await db.insert(createdServersTable)
      .values({
        connection_id: connectionResult[0].id,
        template_id: templateResult[0].id,
        pterodactyl_server_id: 456,
        server_name: 'Python Server',
        server_url: 'https://panel.example.com/server/456',
        status: 'creating'
      })
      .returning()
      .execute();

    // Update to failed status
    await updateServerStatus(serverResult[0].id, 'failed');

    // Verify database was updated
    const servers = await db.select()
      .from(createdServersTable)
      .where(eq(createdServersTable.id, serverResult[0].id))
      .execute();

    expect(servers).toHaveLength(1);
    expect(servers[0].status).toEqual('failed');
    expect(servers[0].updated_at).toBeInstanceOf(Date);
    expect(servers[0].updated_at > serverResult[0].updated_at).toBe(true);
  });

  it('should update status to deleted', async () => {
    // Create prerequisite data
    const connectionResult = await db.insert(pterodactylConnectionsTable)
      .values({
        user_id: 'test-user',
        panel_url: 'https://panel.example.com',
        api_key: 'test-key',
        name: 'Test Connection'
      })
      .returning()
      .execute();

    const templateResult = await db.insert(serverTemplatesTable)
      .values({
        name: 'Test Template',
        description: null,
        language: 'nodejs',
        version: '20',
        egg_id: 3,
        docker_image: 'node:20-alpine',
        startup_command: 'node server.js',
        environment_variables: { PORT: '3000' },
        memory: 1024,
        disk: 2048,
        cpu: 150
      })
      .returning()
      .execute();

    const serverResult = await db.insert(createdServersTable)
      .values({
        connection_id: connectionResult[0].id,
        template_id: templateResult[0].id,
        pterodactyl_server_id: 789,
        server_name: 'Server to Delete',
        server_url: 'https://panel.example.com/server/789',
        status: 'active'
      })
      .returning()
      .execute();

    // Update to deleted status
    const result = await updateServerStatus(serverResult[0].id, 'deleted');

    expect(result.status).toEqual('deleted');
    expect(result.id).toEqual(serverResult[0].id);
    expect(result.server_name).toEqual('Server to Delete');
  });

  it('should throw error for non-existent server', async () => {
    expect(updateServerStatus(999, 'active')).rejects.toThrow(/server with id 999 not found/i);
  });
});
