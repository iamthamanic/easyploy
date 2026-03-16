/**
 * Get Status Tool
 * 
 * SRP: Only retrieves current project/deployment status
 */

import type { ToolHandler, MCPToolResponse } from "../types.js";

interface GetStatusArgs {
  projectPath?: string;
}

export class GetStatusHandler implements ToolHandler {
  name = "get_status";
  description = "Get current project status, deployment state, and health";
  inputSchema = {
    type: "object" as const,
    properties: {
      projectPath: {
        type: "string",
        description: "Optional path to project (defaults to current directory)",
      },
    },
    required: [],
  };

  async execute(args: unknown): Promise<MCPToolResponse> {
    try {
      const { projectPath } = args as GetStatusArgs;
      const targetPath = projectPath || ".";
      
      // This would check actual project status
      // For now, returning a placeholder
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              projectPath: targetPath,
              status: "unknown",
              services: {
                app: "not checked",
                database: "not checked",
                cache: "not checked",
              },
              note: "This is a placeholder. Full implementation will check actual service status.",
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error getting status: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
}
