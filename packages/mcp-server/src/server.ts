/**
 * MCP Server for easyploy
 * 
 * SOLID: Orchestrates tools, depends on abstractions (ToolHandler interface)
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import type { ToolHandler, MCPTool } from "./types.js";
import { ListTemplatesHandler } from "./tools/list-templates.js";
import { CreateProjectHandler } from "./tools/create-project.js";
import { GenerateConfigHandler } from "./tools/generate-config.js";
import { GetStatusHandler } from "./tools/get-status.js";

export class EasyployMCPServer {
  private server: Server;
  private tools: Map<string, ToolHandler>;

  constructor() {
    this.tools = new Map();
    this.registerTools();
    
    this.server = new Server(
      {
        name: "easyploy-mcp-server",
        version: "0.1.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  /**
   * Register all tool handlers
   * OCP: New tools can be added without changing existing code
   */
  private registerTools(): void {
    const handlers: ToolHandler[] = [
      new ListTemplatesHandler(),
      new CreateProjectHandler(),
      new GenerateConfigHandler(),
      new GetStatusHandler(),
    ];

    for (const handler of handlers) {
      this.tools.set(handler.name, handler);
    }
  }

  /**
   * Setup MCP request handlers
   */
  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools: MCPTool[] = Array.from(this.tools.values()).map((handler) => ({
        name: handler.name,
        description: handler.description,
        inputSchema: handler.inputSchema,
      }));

      return { tools };
    });

    // Execute tool
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      const handler = this.tools.get(name);
      if (!handler) {
        return {
          content: [
            {
              type: "text",
              text: `Unknown tool: ${name}`,
            },
          ],
          isError: true,
        };
      }

      return await handler.execute(args);
    });
  }

  /**
   * Start the MCP server
   */
  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    console.error("Easyploy MCP Server running on stdio");
    console.error(`Available tools: ${Array.from(this.tools.keys()).join(", ")}`);
  }
}

// Start server if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new EasyployMCPServer();
  server.start().catch(console.error);
}
