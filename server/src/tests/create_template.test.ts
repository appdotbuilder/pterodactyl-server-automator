
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { serverTemplatesTable } from '../db/schema';
import { type CreateTemplateInput } from '../schema';
import { createTemplate } from '../handlers/create_template';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateTemplateInput = {
  name: 'Test Python Template',
  description: 'A Python template for testing',
  language: 'python',
  version: '3.11',
  egg_id: 15,
  docker_image: 'python:3.11-slim',
  startup_command: 'python main.py',
  environment_variables: {
    'PYTHONPATH': '/app',
    'ENV': 'production'
  },
  memory: 1024,
  disk: 2048,
  cpu: 100
};

describe('createTemplate', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a template', async () => {
    const result = await createTemplate(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Python Template');
    expect(result.description).toEqual('A Python template for testing');
    expect(result.language).toEqual('python');
    expect(result.version).toEqual('3.11');
    expect(result.egg_id).toEqual(15);
    expect(result.docker_image).toEqual('python:3.11-slim');
    expect(result.startup_command).toEqual('python main.py');
    expect(result.environment_variables).toEqual({
      'PYTHONPATH': '/app',
      'ENV': 'production'
    });
    expect(result.memory).toEqual(1024);
    expect(result.disk).toEqual(2048);
    expect(result.cpu).toEqual(100);
    expect(result.is_active).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save template to database', async () => {
    const result = await createTemplate(testInput);

    // Query using proper drizzle syntax
    const templates = await db.select()
      .from(serverTemplatesTable)
      .where(eq(serverTemplatesTable.id, result.id))
      .execute();

    expect(templates).toHaveLength(1);
    expect(templates[0].name).toEqual('Test Python Template');
    expect(templates[0].description).toEqual('A Python template for testing');
    expect(templates[0].language).toEqual('python');
    expect(templates[0].version).toEqual('3.11');
    expect(templates[0].environment_variables).toEqual({
      'PYTHONPATH': '/app',
      'ENV': 'production'
    });
    expect(templates[0].is_active).toEqual(true);
    expect(templates[0].created_at).toBeInstanceOf(Date);
  });

  it('should create template with null description', async () => {
    const inputWithNullDescription: CreateTemplateInput = {
      ...testInput,
      description: null
    };

    const result = await createTemplate(inputWithNullDescription);

    expect(result.description).toBeNull();
    expect(result.name).toEqual('Test Python Template');
  });

  it('should create template with null environment variables', async () => {
    const inputWithNullEnvVars: CreateTemplateInput = {
      ...testInput,
      environment_variables: null
    };

    const result = await createTemplate(inputWithNullEnvVars);

    expect(result.environment_variables).toBeNull();
    expect(result.name).toEqual('Test Python Template');
  });

  it('should create nodejs template', async () => {
    const nodejsInput: CreateTemplateInput = {
      name: 'Test Node.js Template',
      description: 'A Node.js template for testing',
      language: 'nodejs',
      version: '18.0.0',
      egg_id: 16,
      docker_image: 'node:18-alpine',
      startup_command: 'node server.js',
      environment_variables: {
        'NODE_ENV': 'production',
        'PORT': '3000'
      },
      memory: 512,
      disk: 1024,
      cpu: 50
    };

    const result = await createTemplate(nodejsInput);

    expect(result.language).toEqual('nodejs');
    expect(result.version).toEqual('18.0.0');
    expect(result.docker_image).toEqual('node:18-alpine');
    expect(result.startup_command).toEqual('node server.js');
    expect(result.memory).toEqual(512);
    expect(result.disk).toEqual(1024);
    expect(result.cpu).toEqual(50);
  });
});
