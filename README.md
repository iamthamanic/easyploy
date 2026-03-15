# easyploy

easyploy is a declarative, plugin-based deployment CLI for self-hosted stacks. You define what you want (stack, provider, runtime, proxy, secrets, backup, DNS) in one config file; easyploy plans and runs the steps (provision → install → secrets → build → deploy → proxy → DNS → backup) and keeps state for status, update, and destroy. Usage: init (wizard or flags) → plan (review) → deploy; then status, update, or destroy as needed. The tool is provider-, tool-, and stack-agnostic and extensible via new plugins without changing the core.

 See **[PRD.md](./PRD.md)** for a detailed product and usage document in English. One command for provisioning, setup, deploy, and operations.

- **Provider-agnostic** — SSH, Hetzner, Hostinger, etc. via plugins
- **Tool-agnostic** — Docker Compose, Coolify, Caddy, SOPS, etc. via plugins
- **Stack-agnostic** — Supabase, Appwrite, PocketBase, custom stacks via plugins

## Features

### Auto Stack Detection
The `analyze` command automatically detects your tech stack by examining:
- `package.json` dependencies
- Framework-specific config files
- Project structure

**Supported stacks:** nhost, supabase, appwrite, pocketbase, nextjs, react, vue, svelte, express, fastify

### Two-Mode Operation

**Mode A: Existing Repository**
```bash
easyploy analyze [path] [--output config.json] [--dry-run]
```
Analyzes existing code and generates configuration automatically.

**Mode B: New Project from Template**
```bash
easyploy templates
easyploy init --template <name> [project-name]
```
Creates new project from predefined stack templates.

See **[PRD.md](./PRD.md)** for detailed product documentation.

## Quick start

### Modus A: Analyze existing repository (Auto-detection) ✅ Working
```bash
cd ./my-existing-project
easyploy analyze    # Auto-detects stack and creates config
easyploy deploy     # Deploys with detected configuration
```

### Modus B: Initialize new project from template ✅ Working
```bash
easyploy templates                    # List available templates
easyploy init --template supabase myapp  # Create from template
easyploy deploy
```

### Traditional workflow
```bash
npm install -g easyploy
# or
npx easyploy

easyploy init
easyploy deploy
```

## Monorepo

- `apps/cli` — CLI and TUI
- `packages/core` — engine, planner, resolver, state
- `packages/plugin-sdk` — plugin interfaces and contracts
- `packages/config` — config loader and schema
- `packages/executor` — SSH, exec, file helpers
- `packages/logger` — logging
- `packages/ui` — prompts and menus
- `packages/stack-*` — stack plugins (e.g. supabase)
- `packages/provider-*` — provisioner plugins
- `packages/runtime-*`, `packages/proxy-*`, `packages/secrets-*`, etc.

## Development

```bash
pnpm install
pnpm build
pnpm test
```

## License

MIT
