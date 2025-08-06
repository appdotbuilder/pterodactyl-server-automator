
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { 
  pterodactylConnectionsTable, 
  serverTemplatesTable, 
  createdServersTable 
} from '../db/schema';
import { getServerById } from '../handlers/get_server_by_id';

describe('getServerById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return server by id', async () => {
    // Create prerequisite connection
    const connectionResult = await db.insert(pterodactylConnectionsTable)
      .values({
        user_id: 'test-user-1',
        panel_url: 'https://panel.example.com',
        api_key: 'test-api-key',
        name: 'Test Panel Connection'
      })
      .returning()
      .execute();
    const connection = connectionResult[0];

    // Create prerequisite template
    const templateResult = await db.insert(serverTemplatesTable)
      .values({
        name: 'Python 3.11',
        description: 'Python 3.11 template',
        language: 'python',
        version: '3.11',
        egg_id: 5,
        docker_image: 'python:3.11-slim',
        startup_command: 'python main.py',
        environment_variables: { PYTHONPATH: '/app' },
        memory: 512,
        disk: 1024,
        cpu: 100
      })
      .returning()
      .execute();
    const template = templateResult[0];

    // Create test server
    const serverResult = await db.insert(createdServersTable)
      .values({
        connection_id: connection.id,
        template_id: template.id,
        pterodactyl_server_id: 123,
        server_name: 'My Test Server',
        server_url: 'https://panel.example.com/server/123',
        status: 'active'
      })
      .returning()
      .execute();
    const expectedServer = serverResult[0];

    const result = await getServerById(expectedServer.id);

    // Verify all fields are returned correctly
    expect(result).not.toBeNull();
    expect(result!.id).toBe(expectedServer.id);
    expect(result!.connection_id).toBe(connection.id);
    expect(result!.template_id).toBe(template.id);
    expect(result!.pterodactyl_server_id).toBe(123);
    expect(result!.server_name).toBe('My Test Server');
    expect(result!.server_url).toBe('https://panel.example.com/server/123');
    expect(result!.status).toBe('active');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent server id', async () => {
    const result = await getServerById(999);
    expect(result).toBeNull();
  });

  it('should handle server with different status', async () => {
    // Create prerequisite connection
    const connectionResult = await db.insert(pterodactylConnectionsTable)
      .values({
        user_id: 'test-user-2',
        panel_url: 'https://panel2.example.com',
        api_key: 'another-api-key',
        name: 'Another Panel'
      })
      .returning()
      .execute();
    const connection = connectionResult[0];

    // Create prerequisite template
    const templateResult = await db.insert(serverTemplatesTable)
      .values({
        name: 'Node.js 18',
        description: 'Node.js 18 LTS template',
        language: 'nodejs',
        version: '18',
        egg_id: 15,
        docker_image: 'node:18-alpine',
        startup_command: 'npm start',
        environment_variables: { NODE_ENV: 'production' },
        memory: 1024,
        disk: 2048,
        cpu: 150
      })
      .returning()
      .execute();
    const template = templateResult[0];

    // Create server with 'creating' status
    const serverResult = await db.insert(createdServersTable)
      .values({
        connection_id: connection.id,
        template_id: template.id,
        pterodactyl_server_id: 456,
        server_name: 'Creating Server',
        server_url: 'https://panel2.example.com/server/456',
        status: 'creating'
      })
      .returning()
      .execute();
    const expectedServer = serverResult[0];

    const result = await getServerById(expectedServer.id);

    expect(result).not.toBeNull();
    expect(result!.status).toBe('creating');
    expect(result!.server_name).toBe('Creating Server');
    expect(result!.pterodactyl_server_id).toBe(456);
  });

  it('should handle server with failed status', async () => {
    // Create prerequisite connection
    const connectionResult = await db.insert(pterodactylConnectionsTable)
      .values({
        user_id: 'test-user-3',
        panel_url: 'https://panel3.example.com',
        api_key: 'failed-key',
        name: 'Failed Panel'
      })
      .returning()
      .execute();
    const connection = connectionResult[0];

    // Create prerequisite template
    const templateResult = await db.insert(serverTemplatesTable)
      .values({
        name: 'Python 3.9',
        description: null,
        language: 'python',
        version: '3.9',
        egg_id: 3,
        docker_image: 'python:3.9',
        startup_command: 'python app.py',
        environment_variables: null,
        memory: 256,
        disk: 512,
        cpu: 50
      })
      .returning()
      .execute();
    const template = templateResult[0];

    // Create server with 'failed' status
    const serverResult = await db.insert(createdServersTable)
      .values({
        connection_id: connection.id,
        template_id: template.id,
        pterodactyl_server_id: 789,
        server_name: 'Failed Server',
        server_url: 'https://panel3.example.com/server/789',
        status: 'failed'
      })
      .returning()
      .execute();
    const expectedServer = serverResult[0];

    const result = await getServerById(expectedServer.id);

    expect(result).not.toBeNull();
    expect(result!.status).toBe('failed');
    expect(result!.server_name).toBe('Failed Server');
    expect(result!.connection_id).toBe(connection.id);
    expect(result!.template_id).toBe(template.id);
  });
});
