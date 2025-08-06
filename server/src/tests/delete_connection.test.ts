
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pterodactylConnectionsTable, serverTemplatesTable, createdServersTable } from '../db/schema';
import { type CreateConnectionInput, type CreateTemplateInput, type CreateServerInput } from '../schema';
import { deleteConnection } from '../handlers/delete_connection';
import { eq, and } from 'drizzle-orm';

// Test data
const testConnectionInput: CreateConnectionInput = {
  panel_url: 'https://panel.example.com',
  api_key: 'test-api-key-123',
  name: 'Test Connection'
};

const testTemplateInput: CreateTemplateInput = {
  name: 'Test Template',
  description: 'A template for testing',
  language: 'nodejs' as const,
  version: '18.0.0',
  egg_id: 1,
  docker_image: 'node:18-alpine',
  startup_command: 'npm start',
  environment_variables: { NODE_ENV: 'production' },
  memory: 512,
  disk: 1024,
  cpu: 100
};

describe('deleteConnection', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should successfully delete an active connection', async () => {
    // Create a connection
    const connectionResult = await db.insert(pterodactylConnectionsTable)
      .values({
        user_id: 'test-user',
        panel_url: testConnectionInput.panel_url,
        api_key: testConnectionInput.api_key,
        name: testConnectionInput.name,
        is_active: true
      })
      .returning()
      .execute();

    const connectionId = connectionResult[0].id;

    // Delete the connection
    const result = await deleteConnection(connectionId);

    expect(result.success).toBe(true);

    // Verify the connection is soft deleted
    const deletedConnection = await db.select()
      .from(pterodactylConnectionsTable)
      .where(eq(pterodactylConnectionsTable.id, connectionId))
      .execute();

    expect(deletedConnection).toHaveLength(1);
    expect(deletedConnection[0].is_active).toBe(false);
    expect(deletedConnection[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when connection does not exist', async () => {
    await expect(deleteConnection(999)).rejects.toThrow(/Connection with ID 999 not found/i);
  });

  it('should throw error when connection is already deleted', async () => {
    // Create an inactive connection
    const connectionResult = await db.insert(pterodactylConnectionsTable)
      .values({
        user_id: 'test-user',
        panel_url: testConnectionInput.panel_url,
        api_key: testConnectionInput.api_key,
        name: testConnectionInput.name,
        is_active: false
      })
      .returning()
      .execute();

    const connectionId = connectionResult[0].id;

    await expect(deleteConnection(connectionId)).rejects.toThrow(/Connection with ID .+ is already deleted/i);
  });

  it('should throw error when connection has active servers', async () => {
    // Create a connection
    const connectionResult = await db.insert(pterodactylConnectionsTable)
      .values({
        user_id: 'test-user',
        panel_url: testConnectionInput.panel_url,
        api_key: testConnectionInput.api_key,
        name: testConnectionInput.name,
        is_active: true
      })
      .returning()
      .execute();

    const connectionId = connectionResult[0].id;

    // Create a template
    const templateResult = await db.insert(serverTemplatesTable)
      .values({
        name: testTemplateInput.name,
        description: testTemplateInput.description,
        language: testTemplateInput.language,
        version: testTemplateInput.version,
        egg_id: testTemplateInput.egg_id,
        docker_image: testTemplateInput.docker_image,
        startup_command: testTemplateInput.startup_command,
        environment_variables: testTemplateInput.environment_variables,
        memory: testTemplateInput.memory,
        disk: testTemplateInput.disk,
        cpu: testTemplateInput.cpu
      })
      .returning()
      .execute();

    const templateId = templateResult[0].id;

    // Create an active server
    await db.insert(createdServersTable)
      .values({
        connection_id: connectionId,
        template_id: templateId,
        pterodactyl_server_id: 123,
        server_name: 'Test Server',
        server_url: 'https://server.example.com',
        status: 'active'
      })
      .execute();

    await expect(deleteConnection(connectionId)).rejects.toThrow(/Cannot delete connection: 1 active server\(s\) are using this connection/i);
  });

  it('should allow deletion when connection has only inactive servers', async () => {
    // Create a connection
    const connectionResult = await db.insert(pterodactylConnectionsTable)
      .values({
        user_id: 'test-user',
        panel_url: testConnectionInput.panel_url,
        api_key: testConnectionInput.api_key,
        name: testConnectionInput.name,
        is_active: true
      })
      .returning()
      .execute();

    const connectionId = connectionResult[0].id;

    // Create a template
    const templateResult = await db.insert(serverTemplatesTable)
      .values({
        name: testTemplateInput.name,
        description: testTemplateInput.description,
        language: testTemplateInput.language,
        version: testTemplateInput.version,
        egg_id: testTemplateInput.egg_id,
        docker_image: testTemplateInput.docker_image,
        startup_command: testTemplateInput.startup_command,
        environment_variables: testTemplateInput.environment_variables,
        memory: testTemplateInput.memory,
        disk: testTemplateInput.disk,
        cpu: testTemplateInput.cpu
      })
      .returning()
      .execute();

    const templateId = templateResult[0].id;

    // Create inactive servers (failed and deleted status)
    await db.insert(createdServersTable)
      .values([
        {
          connection_id: connectionId,
          template_id: templateId,
          pterodactyl_server_id: 123,
          server_name: 'Failed Server',
          server_url: 'https://failed.example.com',
          status: 'failed'
        },
        {
          connection_id: connectionId,
          template_id: templateId,
          pterodactyl_server_id: 124,
          server_name: 'Deleted Server',
          server_url: 'https://deleted.example.com',
          status: 'deleted'
        }
      ])
      .execute();

    // Should succeed since no active servers
    const result = await deleteConnection(connectionId);

    expect(result.success).toBe(true);

    // Verify connection is soft deleted
    const deletedConnection = await db.select()
      .from(pterodactylConnectionsTable)
      .where(eq(pterodactylConnectionsTable.id, connectionId))
      .execute();

    expect(deletedConnection[0].is_active).toBe(false);
  });
});
