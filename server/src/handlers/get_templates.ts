
import { db } from '../db';
import { serverTemplatesTable } from '../db/schema';
import { type ServerTemplate } from '../schema';
import { eq } from 'drizzle-orm';

export const getTemplates = async (): Promise<ServerTemplate[]> => {
  try {
    // Query for all active templates
    const results = await db.select()
      .from(serverTemplatesTable)
      .where(eq(serverTemplatesTable.is_active, true))
      .execute();

    // Return results with proper type conversion
    return results.map(template => ({
      ...template,
      environment_variables: template.environment_variables as Record<string, string> | null
    }));
  } catch (error) {
    console.error('Failed to fetch templates:', error);
    throw error;
  }
};
