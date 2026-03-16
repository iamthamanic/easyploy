# @easyploy/mcp-server

MCP (Model Context Protocol) Server for easyploy - AI-powered deployment automation.

## Features

- **list_templates**: List all available easyploy templates
- **create_project**: Create new projects from templates
- **generate_config**: Generate deployment configurations (Coolify, Docker Compose, etc.)
- **get_status**: Check project and deployment status

## Usage

### As CLI (stdio transport)

```bash
npx @easyploy/mcp-server
```

### In Code

```typescript
import { EasyployMCPServer } from "@easyploy/mcp-server";

const server = new EasyployMCPServer();
await server.start();
```

## Tools

### list_templates

Lists all available templates with their technologies.

**Input:** None

**Output:**
```json
{
  "templates": [
    {
      "name": "easyploy-vibecode",
      "description": "Vibe Coding optimized stack",
      "technologies": ["Next.js", "Prisma", "PostgreSQL"]
    }
  ],
  "count": 1
}
```

### create_project

Creates a new project from a template.

**Input:**
```json
{
  "template": "easyploy-vibecode",
  "projectName": "my-app",
  "outputPath": "./my-app"
}
```

### generate_config

Generates deployment configuration.

**Input:**
```json
{
  "format": "coolify",
  "outputPath": "./coolify.yaml"
}
```

### get_status

Gets current project status.

**Input:**
```json
{
  "projectPath": "."
}
```

## Architecture

- **SOLID**: Each tool handler has single responsibility
- **Extensible**: New tools can be added without changing existing code
- **Type-safe**: Full TypeScript support

## License

MIT
