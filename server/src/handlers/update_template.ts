
import { db } from '../db';
import { serverTemplatesTable } from '../db/schema';
import { type UpdateTemplateInput, type ServerTemplate } from '../schema';
import { eq } from 'drizzle-orm';

export const updateTemplate = async (input: UpdateTemplateInput): Promise<ServerTemplate> => {
  try {
    // First verify the template exists
    const existingTemplate = await db.select()
      .from(serverTemplatesTable)
      .where(eq(serverTemplatesTable.id, input.id))
      .execute();

    if (existingTemplate.length === 0) {
      throw new Error(`Template with id ${input.id} not found`);
    }

    // Build update object with only provided fields
    const updateData: Partial<typeof serverTemplatesTable.$inferInsert> = {};
    
    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    if (input.language !== undefined) {
      updateData.language = input.language;
    }
    if (input.version !== undefined) {
      updateData.version = input.version;
    }
    if (input.egg_id !== undefined) {
      updateData.egg_id = input.egg_id;
    }
    if (input.docker_image !== undefined) {
      updateData.docker_image = input.docker_image;
    }
    if (input.startup_command !== undefined) {
      updateData.startup_command = input.startup_command;
    }
    if (input.environment_variables !== undefined) {
      updateData.environment_variables = input.environment_variables;
    }
    if (input.memory !== undefined) {
      updateData.memory = input.memory;
    }
    if (input.disk !== undefined) {
      updateData.disk = input.disk;
    }
    if (input.cpu !== undefined) {
      updateData.cpu = input.cpu;
    }
    if (input.is_active !== undefined) {
      updateData.is_active = input.is_active;
    }

    // Update the template
    const result = await db.update(serverTemplatesTable)
      .set(updateData)
      .where(eq(serverTemplatesTable.id, input.id))
      .returning()
      .execute();

    const template = result[0];
    
    // Convert to match ServerTemplate schema type
    return {
      id: template.id,
      name: template.name,
      description: template.description,
      language: template.language,
      version: template.version,
      egg_id: template.egg_id,
      docker_image: template.docker_image,
      startup_command: template.startup_command,
      environment_variables: template.environment_variables as Record<string, string> | null,
      memory: template.memory,
      disk: template.disk,
      cpu: template.cpu,
      is_active: template.is_active,
      created_at: template.created_at
    };
  } catch (error) {
    console.error('Template update failed:', error);
    throw error;
  }
};
