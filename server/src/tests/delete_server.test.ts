
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { createdServersTable, pterodactylConnectionsTable, serverTemplatesTable } from '../db/schema';
import { deleteServer } from '../handlers/delete_server';
import { eq } from 'drizzle-orm';

describe('deleteServer', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testServerId: number;
  let testConnectionId: number;
  let testTemplateId: number;

  beforeEach(async () => {
    // Create prerequisite data
    const connectionResult = await db.insert(pterodactylConnectionsTable)
      .values({
        user_id: 'test-user',
        panel_url: 'https://panel.example.com',
        api_key: 'test-api-key',
        name: 'Test Connection',
        is_active: true
      })
      .returning()
      .execute();
    testConnectionId = connectionResult[0].id;

    const templateResult = await db.insert(serverTemplatesTable)
      .values({
        name: 'Test Template',
        description: 'A test template',
        language: 'python',
        version: '3.9',
        egg_id: 1,
        docker_image: 'python:3.9',
        startup_command: 'python main.py',
        environment_variables: { NODE_ENV: 'production' },
        memory: 512,
        disk: 1024,
        cpu: 100,
        is_active: true
      })
      .returning()
      .execute();
    testTemplateId = templateResult[0].id;

    // Create test server
    const serverResult = await db.insert(createdServersTable)
      .values({
        connection_id: testConnectionId,
        template_id: testTemplateId,
        pterodactyl_server_id: 123,
        server_name: 'Test Server',
        server_url: 'https://server.example.com',
        status: 'active'
      })
      .returning()
      .execute();
    testServerId = serverResult[0].id;
  });

  it('should delete an active server successfully', async () => {
    const result = await deleteServer(testServerId);

    expect(result.success).toBe(true);

    // Verify server status is updated to 'deleted'
    const servers = await db.select()
      .from(createdServersTable)
      .where(eq(createdServersTable.id, testServerId))
      .execute();

    expect(servers).toHaveLength(1);
    expect(servers[0].status).toBe('deleted');
    expect(servers[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent server', async () => {
    await expect(deleteServer(99999)).rejects.toThrow(/server not found/i);
  });

  it('should throw error when trying to delete already deleted server', async () => {
    // First, mark server as deleted
    await db.update(createdServersTable)
      .set({ status: 'deleted' })
      .where(eq(createdServersTable.id, testServerId))
      .execute();

    // Try to delete again
    await expect(deleteServer(testServerId)).rejects.toThrow(/server is already deleted/i);
  });

  it('should allow deletion of failed servers', async () => {
    // Set server status to 'failed'
    await db.update(createdServersTable)
      .set({ status: 'failed' })
      .where(eq(createdServersTable.id, testServerId))
      .execute();

    const result = await deleteServer(testServerId);

    expect(result.success).toBe(true);

    // Verify status changed to 'deleted'
    const servers = await db.select()
      .from(createdServersTable)
      .where(eq(createdServersTable.id, testServerId))
      .execute();

    expect(servers[0].status).toBe('deleted');
  });

  it('should allow deletion of creating servers', async () => {
    // Set server status to 'creating'
    await db.update(createdServersTable)
      .set({ status: 'creating' })
      .where(eq(createdServersTable.id, testServerId))
      .execute();

    const result = await deleteServer(testServerId);

    expect(result.success).toBe(true);

    // Verify status changed to 'deleted'
    const servers = await db.select()
      .from(createdServersTable)
      .where(eq(createdServersTable.id, testServerId))
      .execute();

    expect(servers[0].status).toBe('deleted');
  });
});
