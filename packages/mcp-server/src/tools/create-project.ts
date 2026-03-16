/**
 * Create Project Tool
 * 
 * SRP: Only creates new projects from templates
 */

import type { ToolHandler, MCPToolResponse } from "../types.js";
// TODO: Import from @easyploy/core when available
// import { generateTemplate } from "@easyploy/core";
const generateTemplate = async (config: any) => {
  console.log(`Generating template: ${config.templateName} at ${config.outputPath}`);
  // Placeholder implementation
  return { success: true };
};

interface CreateProjectArgs {
  template: string;
  projectName: string;
  outputPath?: string;
}

export class CreateProjectHandler implements ToolHandler {
  name = "create_project";
  description = "Create a new project from an easyploy template";
  inputSchema = {
    type: "object" as const,
    properties: {
      template: {
        type: "string",
        description: "Name of the template to use (e.g., 'easyploy-vibecode')",
      },
      projectName: {
        type: "string",
        description: "Name of the new project",
      },
      outputPath: {
        type: "string",
        description: "Optional output path (defaults to current directory)",
      },
    },
    required: ["template", "projectName"],
  };

  async execute(args: unknown): Promise<MCPToolResponse> {
    try {
      const { template, projectName, outputPath } = args as CreateProjectArgs;
      
      const targetPath = outputPath || `./${projectName}`;
      
      await generateTemplate({
        templateName: template,
        projectName,
        outputPath: targetPath,
      });

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              success: true,
              message: `Project "${projectName}" created successfully`,
              template: template,
              path: targetPath,
              nextSteps: [
                `cd ${targetPath}`,
                "npm install",
                "npm run stack:up",
              ],
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error creating project: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
}
