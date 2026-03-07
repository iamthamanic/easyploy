# easyploy — Product Requirements Document (English)

## 1. Product name

**easyploy**

---

## 2. What easyploy is

easyploy is an **npm-based CLI** that turns a normal project repo plus minimal infrastructure credentials into a **running, self-hosted deployment** with one flow.

**Goal:** Self-hosted infrastructure with the simplicity of a managed BaaS/PaaS: one consistent CLI, provider-agnostic, tool-agnostic, stack-agnostic, with a pluggable architecture. One command for **provisioning + setup + deploy + operations**.

Users do **not** have to wire together Docker, Coolify, reverse proxies, secrets, backups, DNS, IaC, or server bootstrap by hand.

---

## 3. What the tool does

- **Loads a single config file** (`easyploy.config.json` or `easyploy.config.js`) that describes:
  - Which **stack** to run (e.g. Supabase, Appwrite)
  - Which **provisioner** to use (existing server via SSH, or cloud API e.g. Hetzner)
  - Which **runtime** (e.g. Docker Compose), **proxy** (e.g. Caddy), **secrets**, **backup**, and **DNS** plugins to use
- **Resolves and validates** all referenced plugins (stacks, provisioners, runtimes, etc.) via a plugin SDK; the core has **no hardcoded** tools or providers.
- **Plans** a deployment: ordered steps (provision → install runtime → secrets → build stack → deploy → proxy → DNS → backup → health checks).
- **Deploys** by:
  - Optionally **provisioning** a host (e.g. create server via Hetzner) or using an **existing server** (SSH).
  - **Installing** the chosen runtime (e.g. Docker) on the host.
  - **Generating** secrets and **building** stack artifacts (e.g. Supabase Docker Compose + Kong).
  - **Deploying** the stack on the host (e.g. `docker compose up`).
  - **Configuring** reverse proxy (e.g. Caddy), DNS (e.g. Cloudflare), and backup (e.g. WAL-G) when those plugins are configured.
- **Persists** deployment state in `.easyploy/` (state, inventory, lockfile) for **status**, **update**, and **destroy**.

All of this is **declarative** and **idempotent**: the same config yields the same plan and, when run repeatedly, a consistent deployed state.

---

## 4. How to use the tool

### 4.1 Installation (from repo / development)

```bash
git clone <repo-url>
cd easyploy
pnpm install
pnpm build
```

The CLI entry point is:

- **From repo root:** `node apps/cli/dist/index.js <command> [options]`
- Or link/run the `easyploy` package from `apps/cli` (e.g. `pnpm run build` in `apps/cli` then `node dist/index.js`).

### 4.2 Global / published usage (when published to npm)

```bash
npm install -g easyploy
# or
npx easyploy
```

Then run any command as `easyploy <command> [options]`.

---

### 4.3 Commands

| Command | Purpose |
|--------|--------|
| **No arguments** | Opens the **interactive main menu** (init, deploy, plan, status, update, backup, plugins, doctor, exit). |
| **`init`** | Creates a new deployment config (interactive wizard or non-interactive with flags). Writes `easyploy.config.json` (or you can pass options so it writes the same shape). |
| **`plan`** | Loads config, resolves plugins, validates, and **prints the deployment plan** (list of steps). Use before `deploy`. |
| **`deploy`** | Runs the full flow: provision (if applicable) → install runtime → secrets → build stack → deploy → proxy → DNS → backup → writes `.easyploy/` state. |
| **`status`** | Shows current deployment status (from `.easyploy/state.json` and `inventory.json`). |
| **`update`** | Re-runs the deploy flow (idempotent update). |
| **`destroy`** | Tears down deployment: optionally calls provisioner `destroy`, removes `.easyploy/`. |
| **`doctor`** | Runs diagnostics: config load, plugin resolution, SSH, Docker availability. |

---

### 4.4 Important options

- **`--config <path>`** — Path to config file (default: look for `easyploy.config.json` / `easyploy.config.js` in current directory).
- **`--json`** — For `plan` and `status`: output machine-readable JSON.
- **`--dry-run`** — For `deploy`: only plan, do not apply.
- **`--non-interactive`** — Skip prompts (e.g. for `init` when using flags).
- **`--force`** — For `destroy`: skip confirmation.

Example:

```bash
node apps/cli/dist/index.js plan --config examples/supabase-ssh/easyploy.config.json
node apps/cli/dist/index.js plan --config examples/supabase-ssh/easyploy.config.json --json
```

---

### 4.5 Configuration file

The tool expects a single config file: **`easyploy.config.json`** or **`easyploy.config.js`** (or path given by `--config`).

**Structure:**

- **`project`** — `name`, `environment` (e.g. `"prod"`).
- **`stack`** — `plugin` (e.g. `"@easyploy/stack-supabase"`), optional `config` (e.g. `projectUrl`).
- **`toolchain`** — One plugin ref per role:
  - **`provisioner`** (required) — e.g. `@easyploy/provider-ssh` or `@easyploy/provider-hetzner`.
  - **`runtime`** (required) — e.g. `@easyploy/runtime-docker-compose`.
  - **`proxy`** (optional) — e.g. `@easyploy/proxy-caddy`.
  - **`secrets`** (required) — e.g. `@easyploy/secrets-dotenv` or `@easyploy/secrets-sops`.
  - **`backup`** (optional) — e.g. `@easyploy/backup-walg`, or omit for none.
  - **`dns`** (optional) — e.g. `@easyploy/dns-cloudflare` or `@easyploy/dns-manual`.

Each plugin ref has:

- **`plugin`** — Package name (e.g. `@easyploy/provider-ssh`).
- **`version`** (optional).
- **`config`** (optional) — Plugin-specific options (e.g. for SSH: `host`, `user`, `domain`, `sshKeyPath`; for Hetzner: `apiTokenEnv`, `region`, `serverType`, etc.).

**Example (existing server + Supabase):**

See **`examples/supabase-ssh/easyploy.config.json`** in the repo. It configures:

- Stack: Supabase
- Provisioner: SSH (existing server) with `host`, `user`, `domain`, `sshKeyPath`
- Runtime: Docker Compose
- Proxy: Caddy
- Secrets: dotenv
- Backup: WAL-G
- DNS: manual

---

### 4.6 Typical workflows

**A) First-time setup (existing server)**

1. Run `easyploy init` (or `node apps/cli/dist/index.js init`).
2. Choose stack (e.g. Supabase), provisioner (Existing server), runtime (Docker Compose), proxy (Caddy), secrets, backup, DNS.
3. Enter SSH host, user, domain, project name; config is saved (e.g. `easyploy.config.json`).
4. Run `easyploy plan` to review steps.
5. Run `easyploy deploy` to perform deployment.

**B) Deploy from an existing config**

1. Ensure `easyploy.config.json` (or path passed via `--config`) is present.
2. Run `easyploy plan` to verify.
3. Run `easyploy deploy`.

**C) Check status / update / tear down**

- `easyploy status` — see current deployment info.
- `easyploy update` — run deploy again (idempotent).
- `easyploy destroy` — remove deployment and optionally destroy provisioned resources; use `--force` to skip confirmation.

**D) Non-interactive / automation**

- Use `init` with flags (e.g. `--stack`, `--provider`, `--host`, `--user`, `--domain`, `--non-interactive`).
- Use `plan --json` and `deploy --dry-run` for scripting.

---

## 5. What gets created / where things live

- **Config:** User-created (e.g. `easyploy.config.json` in project root or path given by `--config`).
- **State (after deploy):** `.easyploy/` in the **same directory as the config file**:
  - **`state.json`** — Last deploy time, host, stack, etc.
  - **`inventory.json`** — Host, user, port, domains, services.
  - **`lock.json`** — Lockfile of stack and toolchain plugin versions.

Secrets and keys are **never** logged; the logger redacts sensitive keys.

---

## 6. Plugin system (for extendability)

- **Core** does **not** depend on any concrete tool or provider; it only depends on **interfaces** from **@easyploy/plugin-sdk**.
- **Plugin kinds:** stack, provisioner, runtime, reverse_proxy, secrets, backup, dns, monitoring.
- Each kind has a **contract** (e.g. `validateConfig`, and kind-specific methods like `provision`, `deploy`, `build`, etc.). The core uses **capabilities** (e.g. `deployCompose`, `hostConnection`) to decide what to run, not tool names.
- New tools are added by **new packages** (e.g. `@easyploy/provider-vultr`, `@easyploy/stack-appwrite`) that implement the right interface; **no change in core** is required.

---

## 7. MVP scope (included in this repo)

- **Stack:** Supabase (`@easyploy/stack-supabase`).
- **Provisioners:** SSH existing server (`@easyploy/provider-ssh`), Hetzner (`@easyploy/provider-hetzner`).
- **Runtime:** Docker Compose (`@easyploy/runtime-docker-compose`).
- **Proxy:** Caddy (`@easyploy/proxy-caddy`).
- **Secrets:** dotenv (`@easyploy/secrets-dotenv`), SOPS (`@easyploy/secrets-sops`).
- **Backup:** WAL-G (`@easyploy/backup-walg`).
- **DNS:** manual (`@easyploy/dns-manual`), Cloudflare (`@easyploy/dns-cloudflare`).
- **Commands:** init, plan, deploy, status, update, destroy, doctor.

---

## 8. Repo structure (monorepo)

- **`apps/cli`** — CLI entry and commands (init, plan, deploy, status, update, destroy, doctor) and TUI menu.
- **`packages/plugin-sdk`** — Types and interfaces for all plugins.
- **`packages/config`** — Config schema, loader, defaults, merge.
- **`packages/core`** — Engine, planner, resolver, validation, state/inventory/lockfile.
- **`packages/executor`** — Shell exec, SSH, file and temp helpers.
- **`packages/logger`** — Logging and formatters.
- **`packages/ui`** — Prompts (e.g. @clack/prompts).
- **`packages/stack-supabase`**, **`packages/provider-ssh`**, **`packages/provider-hetzner`**, **`packages/runtime-docker-compose`**, **`packages/proxy-caddy`**, **`packages/secrets-dotenv`**, **`packages/secrets-sops`**, **`packages/backup-walg`**, **`packages/dns-manual`**, **`packages/dns-cloudflare`** — MVP plugins.
- **`examples/supabase-ssh/`** — Example config and usage.

---

## 9. Security and safety

- Secrets are **never** logged in clear text; the logger redacts known secret-like keys.
- **`.easyploy/`** should be treated as sensitive (it can contain host and deployment details).
- **Destroy** asks for confirmation unless `--force` is used.
- No shell injection from raw string composition in the core; shell usage is confined to the executor and plugins.

---

## 10. Summary

**easyploy** is a **declarative, plugin-based deployment CLI** for self-hosted stacks. You define **what** you want (stack, provider, runtime, proxy, secrets, backup, DNS) in **one config file**; easyploy **plans** and **runs** the steps (provision → install → secrets → build → deploy → proxy → DNS → backup) and keeps **state** for status, update, and destroy. Usage: **init** (wizard or flags) → **plan** (review) → **deploy**; then **status**, **update**, or **destroy** as needed. The tool is **provider-, tool-, and stack-agnostic** and extensible via new plugins without changing the core.
