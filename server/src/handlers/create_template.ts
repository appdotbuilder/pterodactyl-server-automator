
import { db } from '../db';
import { serverTemplatesTable } from '../db/schema';
import { type CreateTemplateInput, type ServerTemplate } from '../schema';

export const createTemplate = async (input: CreateTemplateInput): Promise<ServerTemplate> => {
  try {
    // Insert template record
    const result = await db.insert(serverTemplatesTable)
      .values({
        name: input.name,
        description: input.description,
        language: input.language,
        version: input.version,
        egg_id: input.egg_id,
        docker_image: input.docker_image,
        startup_command: input.startup_command,
        environment_variables: input.environment_variables,
        memory: input.memory,
        disk: input.disk,
        cpu: input.cpu
      })
      .returning()
      .execute();

    // Convert the database result to match the expected schema type
    const template = result[0];
    return {
      ...template,
      environment_variables: template.environment_variables as Record<string, string> | null
    };
  } catch (error) {
    console.error('Template creation failed:', error);
    throw error;
  }
};
