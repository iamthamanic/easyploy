/**
 * @easyploy/stack-supabase — Docker Compose template for Supabase (minimal).
 */

export function renderCompose(env: Record<string, string>): string {
  const projectUrl = env.PROJECT_URL ?? "http://127.0.0.1:8000"
  const anonKey = env.ANON_KEY ?? "placeholder"
  const serviceRoleKey = env.SERVICE_ROLE_KEY ?? "placeholder"
  const jwtSecret = env.JWT_SECRET ?? "placeholder"
  const dbPassword = env.POSTGRES_PASSWORD ?? "postgres"

  return `version: "3.8"
services:
  db:
    image: supabase/postgres:15.1.0.147
    restart: unless-stopped
    environment:
      POSTGRES_PASSWORD: ${dbPassword}
    volumes:
      - supabase_db_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  api:
    image: supabase/gotrue:v2.99.0
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
    environment:
      GOTRUE_API_HOST: 0.0.0.0
      GOTRUE_API_PORT: "9999"
      API_EXTERNAL_URL: ${projectUrl}
      GOTRUE_DB_DRIVER: postgres
      GOTRUE_DB_DATABASE_URL: postgres://postgres:${dbPassword}@db:5432/postgres
      GOTRUE_SITE_URL: ${projectUrl}
      GOTRUE_URI_ALLOW_LIST: ${projectUrl}
      GOTRUE_JWT_SECRET: ${jwtSecret}
      GOTRUE_JWT_EXP: "3600"
    ports:
      - "9999:9999"

  rest:
    image: postgrest/postgrest:v12.0.0
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
    environment:
      PGRST_DB_URI: postgres://postgres:${dbPassword}@db:5432/postgres
      PGRST_DB_SCHEMAS: public
      PGRST_DB_ANON_ROLE: anon
      PGRST_JWT_SECRET: ${jwtSecret}
    ports:
      - "3000:3000"

  kong:
    image: kong:2.8
    restart: unless-stopped
    depends_on:
      - api
      - rest
    environment:
      KONG_DATABASE: "off"
      KONG_DECLARATIVE_CONFIG: /var/lib/kong/kong.yml
      KONG_DNS: "off"
      KONG_PROXY_ACCESS_LOG: /dev/stdout
      KONG_ADMIN_ACCESS_LOG: /dev/stdout
      KONG_PROXY_ERROR_LOG: /dev/stderr
      KONG_ADMIN_ERROR_LOG: /dev/stderr
      KONG_ADMIN_LISTEN: "0.0.0.0:8001"
    volumes:
      - ./kong.yml:/var/lib/kong/kong.yml:ro
    ports:
      - "8000:8000"
      - "8443:8443"

volumes:
  supabase_db_data:
`
}
