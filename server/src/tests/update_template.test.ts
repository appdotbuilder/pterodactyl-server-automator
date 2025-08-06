
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { serverTemplatesTable } from '../db/schema';
import { type UpdateTemplateInput } from '../schema';
import { updateTemplate } from '../handlers/update_template';
import { eq } from 'drizzle-orm';

// Create a test template first
const createTestTemplate = async () => {
  const result = await db.insert(serverTemplatesTable)
    .values({
      name: 'Original Template',
      description: 'Original description',
      language: 'python',
      version: '3.9',
      egg_id: 1,
      docker_image: 'python:3.9',
      startup_command: 'python app.py',
      environment_variables: { NODE_ENV: 'test' },
      memory: 256,
      disk: 512,
      cpu: 50,
      is_active: true
    })
    .returning()
    .execute();

  return result[0];
};

describe('updateTemplate', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update template with all fields', async () => {
    const template = await createTestTemplate();
    
    const updateInput: UpdateTemplateInput = {
      id: template.id,
      name: 'Updated Template',
      description: 'Updated description',
      language: 'nodejs',
      version: '18.0',
      egg_id: 2,
      docker_image: 'node:18',
      startup_command: 'node index.js',
      environment_variables: { NODE_ENV: 'production' },
      memory: 1024,
      disk: 2048,
      cpu: 100,
      is_active: false
    };

    const result = await updateTemplate(updateInput);

    expect(result.id).toEqual(template.id);
    expect(result.name).toEqual('Updated Template');
    expect(result.description).toEqual('Updated description');
    expect(result.language).toEqual('nodejs');
    expect(result.version).toEqual('18.0');
    expect(result.egg_id).toEqual(2);
    expect(result.docker_image).toEqual('node:18');
    expect(result.startup_command).toEqual('node index.js');
    expect(result.environment_variables).toEqual({ NODE_ENV: 'production' });
    expect(result.memory).toEqual(1024);
    expect(result.disk).toEqual(2048);
    expect(result.cpu).toEqual(100);
    expect(result.is_active).toEqual(false);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update template with partial fields', async () => {
    const template = await createTestTemplate();
    
    const updateInput: UpdateTemplateInput = {
      id: template.id,
      name: 'Partially Updated',
      memory: 512
    };

    const result = await updateTemplate(updateInput);

    // Updated fields
    expect(result.name).toEqual('Partially Updated');
    expect(result.memory).toEqual(512);
    
    // Unchanged fields should remain the same
    expect(result.description).toEqual('Original description');
    expect(result.language).toEqual('python');
    expect(result.version).toEqual('3.9');
    expect(result.disk).toEqual(512);
    expect(result.cpu).toEqual(50);
    expect(result.is_active).toEqual(true);
  });

  it('should update template with null description', async () => {
    const template = await createTestTemplate();
    
    const updateInput: UpdateTemplateInput = {
      id: template.id,
      description: null
    };

    const result = await updateTemplate(updateInput);

    expect(result.description).toBeNull();
    expect(result.name).toEqual('Original Template'); // Should remain unchanged
  });

  it('should save updated template to database', async () => {
    const template = await createTestTemplate();
    
    const updateInput: UpdateTemplateInput = {
      id: template.id,
      name: 'Database Test Template',
      memory: 768
    };

    await updateTemplate(updateInput);

    // Verify changes were persisted
    const updatedTemplate = await db.select()
      .from(serverTemplatesTable)
      .where(eq(serverTemplatesTable.id, template.id))
      .execute();

    expect(updatedTemplate).toHaveLength(1);
    expect(updatedTemplate[0].name).toEqual('Database Test Template');
    expect(updatedTemplate[0].memory).toEqual(768);
    expect(updatedTemplate[0].description).toEqual('Original description'); // Unchanged
  });

  it('should throw error when template does not exist', async () => {
    const updateInput: UpdateTemplateInput = {
      id: 99999,
      name: 'Non-existent Template'
    };

    await expect(updateTemplate(updateInput)).rejects.toThrow(/Template with id 99999 not found/i);
  });

  it('should handle environment_variables update', async () => {
    const template = await createTestTemplate();
    
    const updateInput: UpdateTemplateInput = {
      id: template.id,
      environment_variables: { 
        PORT: '3000',
        DEBUG: 'true',
        API_KEY: 'secret'
      }
    };

    const result = await updateTemplate(updateInput);

    expect(result.environment_variables).toEqual({ 
      PORT: '3000',
      DEBUG: 'true',
      API_KEY: 'secret'
    });
  });

  it('should handle environment_variables set to null', async () => {
    const template = await createTestTemplate();
    
    const updateInput: UpdateTemplateInput = {
      id: template.id,
      environment_variables: null
    };

    const result = await updateTemplate(updateInput);

    expect(result.environment_variables).toBeNull();
  });
});
