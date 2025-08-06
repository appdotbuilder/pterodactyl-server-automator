
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pterodactylConnectionsTable, serverTemplatesTable, createdServersTable } from '../db/schema';
import { getServers } from '../handlers/get_servers';
import type { CreateConnectionInput, CreateTemplateInput, CreateServerInput } from '../schema';

// Test data
const testConnection: CreateConnectionInput = {
  panel_url: 'https://panel.example.com',
  api_key: 'test-api-key',
  name: 'Test Panel'
};

const testTemplate: CreateTemplateInput = {
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
  cpu: 50
};

describe('getServers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no servers exist', async () => {
    const result = await getServers();
    expect(result).toEqual([]);
  });

  it('should return all created servers', async () => {
    // Create prerequisite connection
    const connectionResult = await db.insert(pterodactylConnectionsTable)
      .values({
        user_id: 'test-user',
        panel_url: testConnection.panel_url,
        api_key: testConnection.api_key,
        name: testConnection.name
      })
      .returning()
      .execute();

    // Create prerequisite template
    const templateResult = await db.insert(serverTemplatesTable)
      .values({
        name: testTemplate.name,
        description: testTemplate.description,
        language: testTemplate.language,
        version: testTemplate.version,
        egg_id: testTemplate.egg_id,
        docker_image: testTemplate.docker_image,
        startup_command: testTemplate.startup_command,
        environment_variables: testTemplate.environment_variables,
        memory: testTemplate.memory,
        disk: testTemplate.disk,
        cpu: testTemplate.cpu
      })
      .returning()
      .execute();

    // Create test servers
    const server1Input: CreateServerInput = {
      connection_id: connectionResult[0].id,
      template_id: templateResult[0].id,
      server_name: 'Test Server 1'
    };

    const server2Input: CreateServerInput = {
      connection_id: connectionResult[0].id,
      template_id: templateResult[0].id,
      server_name: 'Test Server 2'
    };

    await db.insert(createdServersTable)
      .values([
        {
          connection_id: server1Input.connection_id,
          template_id: server1Input.template_id,
          pterodactyl_server_id: 1001,
          server_name: server1Input.server_name,
          server_url: 'https://panel.example.com/server/1001',
          status: 'active'
        },
        {
          connection_id: server2Input.connection_id,
          template_id: server2Input.template_id,
          pterodactyl_server_id: 1002,
          server_name: server2Input.server_name,
          server_url: 'https://panel.example.com/server/1002',
          status: 'creating'
        }
      ])
      .execute();

    const result = await getServers();

    expect(result).toHaveLength(2);
    expect(result[0].server_name).toEqual('Test Server 1');
    expect(result[0].status).toEqual('active');
    expect(result[0].connection_id).toEqual(connectionResult[0].id);
    expect(result[0].template_id).toEqual(templateResult[0].id);
    expect(result[0].pterodactyl_server_id).toEqual(1001);
    expect(result[0].server_url).toEqual('https://panel.example.com/server/1001');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);

    expect(result[1].server_name).toEqual('Test Server 2');
    expect(result[1].status).toEqual('creating');
    expect(result[1].connection_id).toEqual(connectionResult[0].id);
    expect(result[1].template_id).toEqual(templateResult[0].id);
    expect(result[1].pterodactyl_server_id).toEqual(1002);
    expect(result[1].server_url).toEqual('https://panel.example.com/server/1002');
  });

  it('should return servers with different statuses', async () => {
    // Create prerequisite connection and template
    const connectionResult = await db.insert(pterodactylConnectionsTable)
      .values({
        user_id: 'test-user',
        panel_url: testConnection.panel_url,
        api_key: testConnection.api_key,
        name: testConnection.name
      })
      .returning()
      .execute();

    const templateResult = await db.insert(serverTemplatesTable)
      .values({
        name: testTemplate.name,
        description: testTemplate.description,
        language: testTemplate.language,
        version: testTemplate.version,
        egg_id: testTemplate.egg_id,
        docker_image: testTemplate.docker_image,
        startup_command: testTemplate.startup_command,
        environment_variables: testTemplate.environment_variables,
        memory: testTemplate.memory,
        disk: testTemplate.disk,
        cpu: testTemplate.cpu
      })
      .returning()
      .execute();

    // Create servers with different statuses
    await db.insert(createdServersTable)
      .values([
        {
          connection_id: connectionResult[0].id,
          template_id: templateResult[0].id,
          pterodactyl_server_id: 2001,
          server_name: 'Creating Server',
          server_url: 'https://panel.example.com/server/2001',
          status: 'creating'
        },
        {
          connection_id: connectionResult[0].id,
          template_id: templateResult[0].id,
          pterodactyl_server_id: 2002,
          server_name: 'Active Server',
          server_url: 'https://panel.example.com/server/2002',
          status: 'active'
        },
        {
          connection_id: connectionResult[0].id,
          template_id: templateResult[0].id,
          pterodactyl_server_id: 2003,
          server_name: 'Failed Server',
          server_url: 'https://panel.example.com/server/2003',
          status: 'failed'
        },
        {
          connection_id: connectionResult[0].id,
          template_id: templateResult[0].id,
          pterodactyl_server_id: 2004,
          server_name: 'Deleted Server',
          server_url: 'https://panel.example.com/server/2004',
          status: 'deleted'
        }
      ])
      .execute();

    const result = await getServers();

    expect(result).toHaveLength(4);
    
    const statuses = result.map(server => server.status);
    expect(statuses).toContain('creating');
    expect(statuses).toContain('active');
    expect(statuses).toContain('failed');
    expect(statuses).toContain('deleted');

    // Verify all servers have required fields
    result.forEach(server => {
      expect(server.id).toBeDefined();
      expect(server.connection_id).toEqual(connectionResult[0].id);
      expect(server.template_id).toEqual(templateResult[0].id);
      expect(typeof server.pterodactyl_server_id).toBe('number');
      expect(server.server_name).toBeDefined();
      expect(server.server_url).toMatch(/^https:\/\//);
      expect(server.created_at).toBeInstanceOf(Date);
      expect(server.updated_at).toBeInstanceOf(Date);
    });
  });
});
