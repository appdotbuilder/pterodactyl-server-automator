
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { serverTemplatesTable } from '../db/schema';
import { type CreateTemplateInput } from '../schema';
import { getTemplates } from '../handlers/get_templates';

// Test template data
const testTemplate1: CreateTemplateInput = {
  name: 'Python 3.11 Template',
  description: 'Standard Python 3.11 environment',
  language: 'python',
  version: '3.11',
  egg_id: 15,
  docker_image: 'python:3.11-slim',
  startup_command: 'python main.py',
  environment_variables: {
    'PYTHONPATH': '/app',
    'ENV': 'production'
  },
  memory: 512,
  disk: 1024,
  cpu: 50
};

const testTemplate2: CreateTemplateInput = {
  name: 'Node.js 18 Template',
  description: 'Node.js 18 LTS environment',
  language: 'nodejs',
  version: '18',
  egg_id: 17,
  docker_image: 'node:18-alpine',
  startup_command: 'npm start',
  environment_variables: null,
  memory: 256,
  disk: 512,
  cpu: 25
};

describe('getTemplates', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no templates exist', async () => {
    const result = await getTemplates();
    expect(result).toEqual([]);
  });

  it('should return active templates', async () => {
    // Create test templates
    await db.insert(serverTemplatesTable)
      .values([
        {
          name: testTemplate1.name,
          description: testTemplate1.description,
          language: testTemplate1.language,
          version: testTemplate1.version,
          egg_id: testTemplate1.egg_id,
          docker_image: testTemplate1.docker_image,
          startup_command: testTemplate1.startup_command,
          environment_variables: testTemplate1.environment_variables,
          memory: testTemplate1.memory,
          disk: testTemplate1.disk,
          cpu: testTemplate1.cpu,
          is_active: true
        },
        {
          name: testTemplate2.name,
          description: testTemplate2.description,
          language: testTemplate2.language,
          version: testTemplate2.version,
          egg_id: testTemplate2.egg_id,
          docker_image: testTemplate2.docker_image,
          startup_command: testTemplate2.startup_command,
          environment_variables: testTemplate2.environment_variables,
          memory: testTemplate2.memory,
          disk: testTemplate2.disk,
          cpu: testTemplate2.cpu,
          is_active: true
        }
      ])
      .execute();

    const result = await getTemplates();

    expect(result).toHaveLength(2);
    expect(result[0].name).toEqual('Python 3.11 Template');
    expect(result[0].language).toEqual('python');
    expect(result[0].environment_variables).toEqual({
      'PYTHONPATH': '/app',
      'ENV': 'production'
    });
    expect(result[0].memory).toEqual(512);
    expect(result[0].is_active).toBe(true);
    expect(result[0].created_at).toBeInstanceOf(Date);

    expect(result[1].name).toEqual('Node.js 18 Template');
    expect(result[1].language).toEqual('nodejs');
    expect(result[1].environment_variables).toBeNull();
    expect(result[1].memory).toEqual(256);
  });

  it('should only return active templates', async () => {
    // Create one active and one inactive template
    await db.insert(serverTemplatesTable)
      .values([
        {
          name: testTemplate1.name,
          description: testTemplate1.description,
          language: testTemplate1.language,
          version: testTemplate1.version,
          egg_id: testTemplate1.egg_id,
          docker_image: testTemplate1.docker_image,
          startup_command: testTemplate1.startup_command,
          environment_variables: testTemplate1.environment_variables,
          memory: testTemplate1.memory,
          disk: testTemplate1.disk,
          cpu: testTemplate1.cpu,
          is_active: true
        },
        {
          name: 'Inactive Template',
          description: 'This should not appear',
          language: 'python',
          version: '3.10',
          egg_id: 16,
          docker_image: 'python:3.10',
          startup_command: 'python app.py',
          environment_variables: null,
          memory: 128,
          disk: 256,
          cpu: 10,
          is_active: false
        }
      ])
      .execute();

    const result = await getTemplates();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Python 3.11 Template');
    expect(result[0].is_active).toBe(true);
  });

  it('should handle templates with null environment variables', async () => {
    // Create template with null environment_variables
    await db.insert(serverTemplatesTable)
      .values({
        name: testTemplate2.name,
        description: testTemplate2.description,
        language: testTemplate2.language,
        version: testTemplate2.version,
        egg_id: testTemplate2.egg_id,
        docker_image: testTemplate2.docker_image,
        startup_command: testTemplate2.startup_command,
        environment_variables: null,
        memory: testTemplate2.memory,
        disk: testTemplate2.disk,
        cpu: testTemplate2.cpu,
        is_active: true
      })
      .execute();

    const result = await getTemplates();

    expect(result).toHaveLength(1);
    expect(result[0].environment_variables).toBeNull();
    expect(result[0].name).toEqual('Node.js 18 Template');
  });
});
