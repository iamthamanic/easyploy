/**
 * List Templates Tool
 * 
 * SRP: Only lists available templates
 */

import type { ToolHandler, MCPToolResponse, Template } from "../types.js";
// TODO: Import from @easyploy/core when available
// import { getAvailableTemplates } from "@easyploy/core";
const getAvailableTemplates = () => [
  { name: "easyploy-vibecode", description: "Vibe Coding optimized stack", technologies: ["Next.js", "Prisma", "PostgreSQL"] },
  { name: "easyploy-standard", description: "Standard self-hosted stack", technologies: ["PostgreSQL", "PostgREST", "GoTrue"] },
];

export class ListTemplatesHandler implements ToolHandler {
  name = "list_templates";
  description = "List all available easyploy templates with their technologies";
  inputSchema = {
    type: "object" as const,
    properties: {},
    required: [],
  };

  async execute(): Promise<MCPToolResponse> {
    try {
      const templates = getAvailableTemplates();
      
      const formattedTemplates = templates.map((t: Template) => ({
        name: t.name,
        description: t.description,
        technologies: t.technologies,
      }));

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              templates: formattedTemplates,
              count: templates.length,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error listing templates: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
}
