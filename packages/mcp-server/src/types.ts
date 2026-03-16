/**
 * Types and Interfaces for MCP Server
 * 
 * SOLID: Clear contracts for all components
 */

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: object;
}

export interface MCPToolResponse {
  content: Array<{
    type: "text" | "image" | "resource";
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  isError?: boolean;
  _meta?: Record<string, unknown>;
}

export interface Template {
  name: string;
  description: string;
  technologies: string[];
}

export interface ProjectConfig {
  name: string;
  template: string;
  path: string;
}

export interface DeploymentConfig {
  provider: string;
  environment: Record<string, string>;
}

export interface ToolHandler {
  name: string;
  description: string;
  inputSchema: object;
  execute(args: unknown): Promise<MCPToolResponse>;
}
