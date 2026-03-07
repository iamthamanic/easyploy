# easyploy

easyploy is a declarative, plugin-based deployment CLI for self-hosted stacks. You define what you want (stack, provider, runtime, proxy, secrets, backup, DNS) in one config file; easyploy plans and runs the steps (provision → install → secrets → build → deploy → proxy → DNS → backup) and keeps state for status, update, and destroy. Usage: init (wizard or flags) → plan (review) → deploy; then status, update, or destroy as needed. The tool is provider-, tool-, and stack-agnostic and extensible via new plugins without changing the core.

 See **[PRD.md](./PRD.md)** for a detailed product and usage document in English. One command for provisioning, setup, deploy, and operations.

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
