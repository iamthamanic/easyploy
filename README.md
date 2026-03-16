# easyploy 🚀

[![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)](https://github.com/iamthamanic/easyploy)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node-18+-green.svg)](https://nodejs.org/)

> **Declarative deployment engine for self-hosted infrastructure.**
> 
> One config file → Provision → Deploy → Monitor. Simple.

---

## ✨ Features

- 🎯 **Declarative** — Define your stack in one JSON file
- 🔌 **Plugin-based** — Extensible architecture (providers, runtimes, stacks)
- 🤖 **AI-Ready** — MCP Server for Claude/Cursor integration
- 🏗️ **Stack Detection** — Auto-detects your tech stack
- 🚀 **Multiple Deployments** — Coolify, SSH, Docker Compose
- 📊 **Monitoring** — Status checks and health monitoring
- 🔄 **Updates** — Idempotent updates without downtime

---

## 🚀 Quick Start (5 Minuten)

### 1. Install

```bash
npm install -g @easyploy/cli
# oder
pnpm add -g @easyploy/cli
```

### 2. Initialize

**Option A: New Project from Template**
```bash
easyploy templates                    # List available templates
easyploy init --template easyploy-vibecode my-app
cd my-app
```

**Option B: Analyze Existing Project**
```bash
cd my-existing-project
easyploy analyze    # Auto-detects your stack
easyploy deploy     # Deploys to your server
```

### 3. Deploy

```bash
easyploy deploy --provider ssh --host your-server.com
```

**Done!** Your app is running on `http://your-server.com:3000`

---

## 📦 Available Templates

| Template | Stack | Best For |
|----------|-------|----------|
| **easyploy-vibecode** | Next.js + Prisma + PostgreSQL + MinIO + Redis | AI-powered apps, rapid prototyping |
| **easyploy-standard** | PostgreSQL + PostgREST + GoTrue + MinIO | Self-hosted backend, APIs |
| **supabase** | Full Supabase Stack | Firebase alternative |
| **appwrite** | Appwrite Stack | All-in-one backend |
| **nhost** | Hasura + PostgreSQL + Auth | GraphQL APIs |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│         easyploy CLI                    │
│  ┌─────────┐  ┌─────────┐  ┌────────┐ │
│  │  init   │  │ analyze │  │ deploy │ │
│  └────┬────┘  └────┬────┘  └───┬────┘ │
│       └─────────────┴───────────┘      │
│                   │                     │
│              ┌────┴────┐                │
│              │  Core   │                │
│              └────┬────┘                │
│       ┌───────────┼───────────┐          │
│       ▼           ▼           ▼          │
│  ┌────────┐  ┌────────┐  ┌────────┐     │
│  │Provider│  │Runtime │  │ Stack  │     │
│  │(SSH)   │  │(Docker)│  │(Next)  │     │
│  └────────┘  └────────┘  └────────┘     │
└─────────────────────────────────────────┘
```

---

## 🛠️ Deployment Options

### Option 1: SSH (Direct)

Deploy directly to any VPS with Docker.

```bash
easyploy deploy --provider ssh --host your-server.com --user root
```

**Pros:**
- Full control
- No additional services needed
- Works with any VPS

**Cons:**
- Manual SSL setup
- No automatic updates

---

### Option 2: Coolify (Recommended)

Deploy to Coolify-managed server.

```bash
easyploy config --output coolify.yaml
# Import in Coolify UI
easyploy deploy --provider coolify
```

**Pros:**
- Automatic SSL
- Web UI for management
- Automatic deployments

**Cons:**
- Requires Coolify installation

---

### Option 3: Local Development

Run locally with docker-compose.

```bash
easyploy init --template easyploy-vibecode my-app
cd my-app
npm run stack:up
```

---

## 🤖 AI Integration (MCP)

Use easyploy with Claude, Cursor, or any MCP client:

```bash
# Start MCP Server
npx @easyploy/mcp-server
```

**Available Tools:**
- `list_templates` — List all templates
- `create_project` — Create new project
- `generate_config` — Generate deployment config
- `get_status` — Check deployment status

**Example with Claude:**
```
User: "Create a new project with the vibecode template"
Claude: [Uses MCP to create project]
```

---

## 📋 Configuration

### easyploy.config.json

```json
{
  "name": "my-app",
  "template": "easyploy-vibecode",
  "deployment": {
    "provider": "ssh",
    "host": "your-server.com",
    "user": "root",
    "privateKey": "~/.ssh/id_ed25519"
  },
  "environment": {
    "NODE_ENV": "production",
    "DATABASE_URL": "postgresql://..."
  }
}
```

---

## 🧪 Commands

| Command | Description |
|---------|-------------|
| `easyploy init` | Initialize new project |
| `easyploy analyze` | Analyze existing project |
| `easyploy deploy` | Deploy to server |
| `easyploy status` | Check deployment status |
| `easyploy update` | Update deployment |
| `easyploy destroy` | Remove deployment |
| `easyploy templates` | List available templates |
| `easyploy config` | Generate config files |
| `easyploy doctor` | Diagnose issues |

---

## ❓ FAQ

### Q: What is easyploy?
**A:** A declarative deployment tool for self-hosted infrastructure. Think Terraform + Docker Compose + Coolify combined.

### Q: Do I need Coolify?
**A:** No! You can deploy via SSH directly to any VPS.

### Q: Can I use my own templates?
**A:** Yes! Templates are just JSON files. Create your own.

### Q: Is it production-ready?
**A:** It's in early development. Use for side projects and experiments.

### Q: How is it different from Docker Compose?
**A:** easyploy adds provisioning, deployment orchestration, and multi-server support on top of Docker Compose.

### Q: Can I deploy to AWS/GCP/Azure?
**A:** Not yet. Currently supports SSH and Coolify. Cloud providers coming soon.

### Q: How do I update my deployment?
**A:** Run `easyploy update` — it's idempotent and only changes what needs changing.

### Q: What if deployment fails?
**A:** easyploy shows detailed error logs. You can rollback with `easyploy destroy` and redeploy.

### Q: Is there a web UI?
**A:** Not yet. It's CLI-only for now.

### Q: Can I use it with GitHub Actions?
**A:** Yes! Use the n8n workflow for CI/CD.

---

## 🛣️ Roadmap

- [x] Core CLI
- [x] Template system
- [x] SSH deployment
- [x] MCP Server
- [x] Coolify export
- [ ] AWS/GCP/Azure providers
- [ ] Kubernetes support
- [ ] Web UI
- [ ] Automatic SSL
- [ ] Database migrations

---

## 🤝 Contributing

Contributions welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md)

---

## 📄 License

MIT © [iamthamanic](https://github.com/iamthamanic)

---

## 🔗 Links

- [Documentation](./docs)
- [PRD (Product Requirements)](./PRD.md)
- [Issues](https://github.com/iamthamanic/easyploy/issues)
- [Discussions](https://github.com/iamthamanic/easyploy/discussions)

---

**Made with ❤️ for the self-hosting community**
