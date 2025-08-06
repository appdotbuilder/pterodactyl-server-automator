
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { createdServersTable, pterodactylConnectionsTable, serverTemplatesTable } from '../db/schema';
import { type CreateServerInput } from '../schema';
import { createServer } from '../handlers/create_server';
import { eq } from 'drizzle-orm';

describe('createServer', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let connectionId: number;
  let templateId: number;

  const setupPrerequisites = async () => {
    // Create a test connection
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
    connectionId = connectionResult[0].id;

    // Create a test template
    const templateResult = await db.insert(serverTemplatesTable)
      .values({
        name: 'Test Template',
        description: 'A template for testing',
        language: 'nodejs',
        version: '18.0.0',
        egg_id: 1,
        docker_image: 'node:18-alpine',
        startup_command: 'npm start',
        environment_variables: { NODE_ENV: 'production' },
        memory: 512,
        disk: 1024,
        cpu: 50,
        is_active: true
      })
      .returning()
      .execute();
    templateId = templateResult[0].id;
  };

  it('should create a server successfully', async () => {
    await setupPrerequisites();

    const input: CreateServerInput = {
      connection_id: connectionId,
      template_id: templateId,
      server_name: 'Test Server'
    };

    const result = await createServer(input);

    expect(result.connection_id).toEqual(connectionId);
    expect(result.template_id).toEqual(templateId);
    expect(result.server_name).toEqual('Test Server');
    expect(result.status).toEqual('creating');
    expect(result.pterodactyl_server_id).toBeGreaterThan(0);
    expect(result.server_url).toMatch(/^https:\/\/panel\.example\.com\/server\/\d+$/);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save server to database', async () => {
    await setupPrerequisites();

    const input: CreateServerInput = {
      connection_id: connectionId,
      template_id: templateId,
      server_name: 'Database Test Server'
    };

    const result = await createServer(input);

    const servers = await db.select()
      .from(createdServersTable)
      .where(eq(createdServersTable.id, result.id))
      .execute();

    expect(servers).toHaveLength(1);
    expect(servers[0].server_name).toEqual('Database Test Server');
    expect(servers[0].connection_id).toEqual(connectionId);
    expect(servers[0].template_id).toEqual(templateId);
    expect(servers[0].status).toEqual('creating');
  });

  it('should throw error when connection does not exist', async () => {
    await setupPrerequisites();

    const input: CreateServerInput = {
      connection_id: 99999, // Non-existent connection
      template_id: templateId,
      server_name: 'Test Server'
    };

    expect(createServer(input)).rejects.toThrow(/connection not found/i);
  });

  it('should throw error when connection is inactive', async () => {
    await setupPrerequisites();

    // Make connection inactive
    await db.update(pterodactylConnectionsTable)
      .set({ is_active: false })
      .where(eq(pterodactylConnectionsTable.id, connectionId))
      .execute();

    const input: CreateServerInput = {
      connection_id: connectionId,
      template_id: templateId,
      server_name: 'Test Server'
    };

    expect(createServer(input)).rejects.toThrow(/connection not found/i);
  });

  it('should throw error when template does not exist', async () => {
    await setupPrerequisites();

    const input: CreateServerInput = {
      connection_id: connectionId,
      template_id: 99999, // Non-existent template
      server_name: 'Test Server'
    };

    expect(createServer(input)).rejects.toThrow(/template not found/i);
  });

  it('should throw error when template is inactive', async () => {
    await setupPrerequisites();

    // Make template inactive
    await db.update(serverTemplatesTable)
      .set({ is_active: false })
      .where(eq(serverTemplatesTable.id, templateId))
      .execute();

    const input: CreateServerInput = {
      connection_id: connectionId,
      template_id: templateId,
      server_name: 'Test Server'
    };

    expect(createServer(input)).rejects.toThrow(/template not found/i);
  });

  it('should generate correct server URL format', async () => {
    await setupPrerequisites();

    const input: CreateServerInput = {
      connection_id: connectionId,
      template_id: templateId,
      server_name: 'URL Test Server'
    };

    const result = await createServer(input);

    // URL should be panel_url + /server/ + pterodactyl_server_id
    const expectedUrlPattern = new RegExp(
      `^https://panel\\.example\\.com/server/${result.pterodactyl_server_id}$`
    );
    expect(result.server_url).toMatch(expectedUrlPattern);
  });
});
