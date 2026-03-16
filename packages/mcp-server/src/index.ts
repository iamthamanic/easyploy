/**
 * MCP Server for easyploy
 * 
 * Main entry point for the MCP server package
 */

export { EasyployMCPServer } from "./server.js";
export type {
  MCPTool,
  MCPToolResponse,
  Template,
  ProjectConfig,
  DeploymentConfig,
  ToolHandler,
} from "./types.js";

// Tool handlers (for advanced usage)
export { ListTemplatesHandler } from "./tools/list-templates.js";
export { CreateProjectHandler } from "./tools/create-project.js";
export { GenerateConfigHandler } from "./tools/generate-config.js";
export { GetStatusHandler } from "./tools/get-status.js";
