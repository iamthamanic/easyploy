# easyploy

Declarative deployment engine for self-hosted infrastructure. See **[PRD.md](./PRD.md)** for a detailed product and usage document in English. One command for provisioning, setup, deploy, and operations.

- **Provider-agnostic** — SSH, Hetzner, Hostinger, etc. via plugins
- **Tool-agnostic** — Docker Compose, Coolify, Caddy, SOPS, etc. via plugins
- **Stack-agnostic** — Supabase, Appwrite, PocketBase, custom stacks via plugins

## Quick start

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
