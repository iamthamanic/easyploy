export interface TemplateFile {
  path: string;
  content: string;
}

export interface Template {
  name: string;
  description: string;
  technologies: string[];
  files: TemplateFile[];
}

export function getAvailableTemplates(): Template[] {
  return [
    {
      name: "easyploy-standard",
      description: "Self-hosted backend with PostgreSQL + PostgREST + GoTrue + MinIO - hosting friendly, CLI & MCP ready",
      technologies: ["PostgreSQL", "PostgREST", "GoTrue", "MinIO", "React", "TypeScript", "MCP"],
      files: [
        {
          path: "package.json",
          content: JSON.stringify({
            name: "{{PROJECT_NAME}}",
            version: "0.1.0",
            private: true,
            scripts: {
              dev: "vite",
              build: "tsc && vite build",
              preview: "vite preview",
              "db:up": "docker-compose up -d postgres",
              "db:migrate": "psql $DATABASE_URL -f migrations/001_init.sql",
              "db:console": "psql $DATABASE_URL",
              "api:up": "docker-compose up -d postgrest",
              "auth:up": "docker-compose up -d gotrue",
              "storage:up": "docker-compose up -d minio",
              "stack:up": "docker-compose up -d",
              "stack:down": "docker-compose down",
              "stack:logs": "docker-compose logs -f",
              "mcp:serve": "npx ts-node mcp-server/index.ts"
            },
            dependencies: {
              react: "^18.2.0",
              "react-dom": "^18.2.0",
              "@supabase/supabase-js": "^2.39.0"
            },
            devDependencies: {
              "@types/react": "^18.2.0",
              "@types/react-dom": "^18.2.0",
              "@vitejs/plugin-react": "^4.0.0",
              typescript: "^5.0.0",
              vite: "^5.0.0"
            }
          }, null, 2)
        },
        {
          path: "docker-compose.yml",
          content: `version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD:-postgres}
      POSTGRES_DB: app
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./migrations:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  postgrest:
    image: postgrest/postgrest:v11.0.0
    environment:
      PGRST_DB_URI: postgres://postgres:\${POSTGRES_PASSWORD:-postgres}@postgres:5432/app
      PGRST_DB_SCHEMA: public
      PGRST_DB_ANON_ROLE: anon
      PGRST_JWT_SECRET: \${JWT_SECRET:-your-jwt-secret}
    ports:
      - "3001:3000"
    depends_on:
      postgres:
        condition: service_healthy

  gotrue:
    image: supabase/gotrue:v2.0.0
    environment:
      GOTRUE_DB_DRIVER: postgres
      GOTRUE_DB_DATABASE_URL: postgres://postgres:\${POSTGRES_PASSWORD:-postgres}@postgres:5432/app?sslmode=disable
      GOTRUE_JWT_SECRET: \${JWT_SECRET:-your-jwt-secret}
      GOTRUE_JWT_EXP: 3600
      GOTRUE_JWT_DEFAULT_GROUP_NAME: authenticated
      GOTRUE_SITE_URL: \${SITE_URL:-http://localhost:3000}
      GOTRUE_URI_ALLOW_LIST: "*"
      GOTRUE_DISABLE_SIGNUP: "false"
      GOTRUE_MAILER_AUTOCONFIRM: "true"
    ports:
      - "9999:9999"
    depends_on:
      - postgres

  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: \${MINIO_ROOT_USER:-minioadmin}
      MINIO_ROOT_PASSWORD: \${MINIO_ROOT_PASSWORD:-minioadmin}
    volumes:
      - minio_data:/data
    ports:
      - "9000:9000"
      - "9001:9001"

  minio-init:
    image: minio/mc:latest
    depends_on:
      - minio
    entrypoint: >
      /bin/sh -c "
      sleep 5;
      mc alias set local http://minio:9000 \${MINIO_ROOT_USER:-minioadmin} \${MINIO_ROOT_PASSWORD:-minioadmin};
      mc mb local/uploads || true;
      mc policy set public local/uploads;
      "

volumes:
  postgres_data:
  minio_data:`
        },
        {
          path: ".env.example",
          content: `POSTGRES_PASSWORD=your-secure-password
JWT_SECRET=your-jwt-secret-min-32-chars
SITE_URL=http://localhost:3000
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin
VITE_API_URL=http://localhost:3001
VITE_AUTH_URL=http://localhost:9999
VITE_STORAGE_URL=http://localhost:9000`
        },
        {
          path: "migrations/001_init.sql",
          content: `CREATE TABLE IF NOT EXISTS todos (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    title TEXT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE ROLE anon NOLOGIN;
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

CREATE ROLE authenticated NOLOGIN;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only see their own todos" ON todos
    FOR ALL USING (user_id = auth.uid());`
        },
        {
          path: "src/lib/api.ts",
          content: `const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export async function getTodos() {
  const res = await fetch(\`\${API_URL}/todos\`);
  return res.json();
}

export async function createTodo(title: string) {
  const res = await fetch(\`\${API_URL}/todos\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  return res.json();
}

export async function updateTodo(id: number, completed: boolean) {
  const res = await fetch(\`\${API_URL}/todos?id=eq.\${id}\`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ completed }),
  });
  return res.json();
}

export async function deleteTodo(id: number) {
  const res = await fetch(\`\${API_URL}/todos?id=eq.\${id}\`, { method: 'DELETE' });
  return res.ok;
}`
        },
        {
          path: "src/lib/auth.ts",
          content: `import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_AUTH_URL || 'http://localhost:9999';
const supabaseKey = 'anon-key';

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function signUp(email: string, password: string) {
  return supabase.auth.signUp({ email, password });
}

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  await supabase.auth.signOut();
}

export function getUser() {
  return supabase.auth.getUser();
}

export function onAuthStateChange(callback: (event: string, session: any) => void) {
  return supabase.auth.onAuthStateChange(callback);
}`
        },
        {
          path: "src/App.tsx",
          content: `import { useEffect, useState } from 'react';
import { getTodos, createTodo, updateTodo, deleteTodo } from './lib/api';
import { signIn, signUp, signOut, getUser, onAuthStateChange } from './lib/auth';
import './App.css';

function App() {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    loadTodos();
    checkUser();
    const { data: { subscription } } = onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function loadTodos() {
    const data = await getTodos();
    setTodos(data);
  }

  async function checkUser() {
    const { data: { user } } = await getUser();
    setUser(user);
  }

  async function handleAddTodo(e: React.FormEvent) {
    e.preventDefault();
    if (!newTodo.trim()) return;
    await createTodo(newTodo);
    setNewTodo('');
    loadTodos();
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    await signUp(email, password);
    alert('Check your email!');
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    await signIn(email, password);
  }

  async function handleSignOut() {
    await signOut();
    setUser(null);
  }

  if (!user) {
    return (
      <div className="App">
        <h1>Easyploy Standard</h1>
        <form onSubmit={handleSignIn}>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button type="submit">Sign In</button>
          <button type="button" onClick={handleSignUp}>Sign Up</button>
        </form>
      </div>
    );
  }

  return (
    <div className="App">
      <header>
        <h1>Easyploy Standard</h1>
        <span>Welcome, {user.email}</span>
        <button onClick={handleSignOut}>Sign Out</button>
      </header>
      <form onSubmit={handleAddTodo}>
        <input value={newTodo} onChange={(e) => setNewTodo(e.target.value)} placeholder="Add a todo..." />
        <button type="submit">Add</button>
      </form>
      <ul>
        {todos.map((todo: any) => (
          <li key={todo.id}>
            <input type="checkbox" checked={todo.completed} onChange={() => updateTodo(todo.id, !todo.completed).then(loadTodos)} />
            <span style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}>{todo.title}</span>
            <button onClick={() => deleteTodo(todo.id).then(loadTodos)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;`
        },
        {
          path: "README.md",
          content: `# {{PROJECT_NAME}}

Created with **easyploy-standard** template.

## Stack

- **PostgreSQL** - Database
- **PostgREST** - Auto-generated REST API
- **GoTrue** - Auth (Supabase-compatible)
- **MinIO** - S3-compatible storage
- **React + TypeScript** - Frontend
- **MCP Server** - AI integration

## Quick Start

\`\`\`bash
# 1. Setup
cp .env.example .env
# Edit .env

# 2. Start stack
npm run stack:up

# 3. Run migrations
npm run db:migrate

# 4. Start frontend
npm run dev
\`\`\`

## Services

| Service | URL | CLI Access |
|---------|-----|------------|
| Frontend | http://localhost:3000 | - |
| API | http://localhost:3001 | curl |
| Auth | http://localhost:9999 | curl |
| Storage | http://localhost:9000 | mc |
| Storage UI | http://localhost:9001 | browser |

## MCP Server

\`\`\`bash
npm run mcp:serve
\`\`\`

Tools: query_database, create_record, upload_file, auth_user`
        },
        {
          path: "mcp-server/index.ts",
          content: `#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

const server = new Server({ name: 'easyploy-standard', version: '1.0.0' }, { capabilities: { tools: {} } });

const tools = [
  { name: 'query_database', description: 'Execute SQL query', inputSchema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } },
  { name: 'create_record', description: 'Create record via API', inputSchema: { type: 'object', properties: { table: { type: 'string' }, data: { type: 'object' } }, required: ['table', 'data'] } },
  { name: 'upload_file', description: 'Upload to storage', inputSchema: { type: 'object', properties: { path: { type: 'string' }, content: { type: 'string' } }, required: ['path', 'content'] } },
  { name: 'auth_user', description: 'Get user info', inputSchema: { type: 'object', properties: {} } }
];

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name } = request.params;
  return { content: [{ type: 'text', text: \`\${name} executed\` }] };
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Easyploy MCP server running');
}

main().catch(console.error);`
        }
      ]
    },
    {
      name: "nhost",
      description: "Full-stack app with Nhost (PostgreSQL + Hasura + Auth + Storage)",
      technologies: ["React", "TypeScript", "Nhost", "GraphQL", "PostgreSQL"],
      files: [
        {
          path: "package.json",
          content: JSON.stringify({
            name: "{{PROJECT_NAME}}",
            version: "0.1.0",
            private: true,
            scripts: {
              dev: "vite",
              build: "tsc && vite build",
              preview: "vite preview",
            },
            dependencies: {
              "@nhost/nhost-js": "^2.0.0",
              "@nhost/react": "^2.0.0",
              react: "^18.2.0",
              "react-dom": "^18.2.0",
            },
            devDependencies: {
              "@types/react": "^18.2.0",
              "@types/react-dom": "^18.2.0",
              "@vitejs/plugin-react": "^4.0.0",
              typescript: "^5.0.0",
              vite: "^5.0.0",
            },
          }, null, 2),
        },
        {
          path: "src/main.tsx",
          content: `import React from 'react'
import ReactDOM from 'react-dom/client'
import { NhostProvider } from '@nhost/react'
import { nhost } from './lib/nhost'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <NhostProvider nhost={nhost}>
      <App />
    </NhostProvider>
  </React.StrictMode>,
)`,
        },
        {
          path: "src/lib/nhost.ts",
          content: `import { NhostClient } from '@nhost/nhost-js'

export const nhost = new NhostClient({
  subdomain: import.meta.env.VITE_NHOST_SUBDOMAIN || '',
  region: import.meta.env.VITE_NHOST_REGION || 'eu-central-1',
})
`,
        },
        {
          path: "src/App.tsx",
          content: `import { useAuthenticationStatus } from '@nhost/react'
import { Auth } from './components/Auth'
import { Dashboard } from './components/Dashboard'
import './App.css'

function App() {
  const { isAuthenticated, isLoading } = useAuthenticationStatus()

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="App">
      {isAuthenticated ? <Dashboard /> : <Auth />}
    </div>
  )
}

export default App
`,
        },
        {
          path: "src/components/Auth.tsx",
          content: `import { useState } from 'react'
import { useSignInEmailPassword, useSignUpEmailPassword } from '@nhost/react'

export function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  
  const { signInEmailPassword, error: signInError } = useSignInEmailPassword()
  const { signUpEmailPassword, error: signUpError } = useSignUpEmailPassword()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSignUp) {
      await signUpEmailPassword(email, password)
    } else {
      await signInEmailPassword(email, password)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>{isSignUp ? 'Sign Up' : 'Sign In'}</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit">
        {isSignUp ? 'Sign Up' : 'Sign In'}
      </button>
      
      <button type="button" onClick={() => setIsSignUp(!isSignUp)}>
        {isSignUp ? 'Already have an account?' : 'Create account'}
      </button>
      
      {(signInError || signUpError) && (
        <p style={{ color: 'red' }}>{signInError?.message || signUpError?.message}</p>
      )}
    </form>
  )
}
`,
        },
        {
          path: "src/components/Dashboard.tsx",
          content: `import { useSignOut, useUserData } from '@nhost/react'

export function Dashboard() {
  const { signOut } = useSignOut()
  const user = useUserData()

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {user?.email}!</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  )
}
`,
        },
        {
          path: ".env.example",
          content: `VITE_NHOST_SUBDOMAIN=your-subdomain
VITE_NHOST_REGION=eu-central-1
`,
        },
        {
          path: "README.md",
          content: `# {{PROJECT_NAME}}

Created with easyploy nhost template.

## Setup

1. Copy \`.env.example\` to \`.env\` and fill in your Nhost credentials
2. Run \`npm install\`
3. Run \`npm run dev\`

## Deployment

\`\`\`bash
easyploy deploy
\`\`\`
`,
        },
      ],
    },
    {
      name: "supabase",
      description: "Full-stack app with Supabase (PostgreSQL + Auth + Realtime)",
      technologies: ["React", "TypeScript", "Supabase", "PostgreSQL"],
      files: [
        {
          path: "package.json",
          content: JSON.stringify({
            name: "{{PROJECT_NAME}}",
            version: "0.1.0",
            private: true,
            scripts: {
              dev: "vite",
              build: "tsc && vite build",
              preview: "vite preview",
            },
            dependencies: {
              "@supabase/supabase-js": "^2.0.0",
              "@supabase/auth-helpers-react": "^0.4.0",
              react: "^18.2.0",
              "react-dom": "^18.2.0",
            },
            devDependencies: {
              "@types/react": "^18.2.0",
              "@types/react-dom": "^18.2.0",
              "@vitejs/plugin-react": "^4.0.0",
              typescript: "^5.0.0",
              vite: "^5.0.0",
            },
          }, null, 2),
        },
        {
          path: "src/lib/supabase.ts",
          content: `import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseKey)
`,
        },
        {
          path: ".env.example",
          content: `VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
`,
        },
        {
          path: "README.md",
          content: `# {{PROJECT_NAME}}

Created with easyploy supabase template.

## Setup

1. Copy \`.env.example\` to \`.env\` and fill in your Supabase credentials
2. Run \`npm install\`
3. Run \`npm run dev\`

## Deployment

\`\`\`bash
easyploy deploy
\`\`\`
`,
        },
      ],
    },
    {
      name: "appwrite",
      description: "Full-stack app with Appwrite (Database + Auth + Storage + Functions)",
      technologies: ["React", "TypeScript", "Appwrite"],
      files: [
        {
          path: "package.json",
          content: JSON.stringify({
            name: "{{PROJECT_NAME}}",
            version: "0.1.0",
            private: true,
            scripts: {
              dev: "vite",
              build: "tsc && vite build",
              preview: "vite preview",
            },
            dependencies: {
              appwrite: "^13.0.0",
              react: "^18.2.0",
              "react-dom": "^18.2.0",
            },
            devDependencies: {
              "@types/react": "^18.2.0",
              "@types/react-dom": "^18.2.0",
              "@vitejs/plugin-react": "^4.0.0",
              typescript: "^5.0.0",
              vite: "^5.0.0",
            },
          }, null, 2),
        },
        {
          path: "src/lib/appwrite.ts",
          content: `import { Client, Account, Databases, Storage } from 'appwrite'

const client = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT || '')
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID || '')

export const account = new Account(client)
export const databases = new Databases(client)
export const storage = new Storage(client)
`,
        },
        {
          path: ".env.example",
          content: `VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=your-project-id
`,
        },
        {
          path: "README.md",
          content: `# {{PROJECT_NAME}}

Created with easyploy appwrite template.

## Setup

1. Copy \`.env.example\` to \`.env\` and fill in your Appwrite credentials
2. Run \`npm install\`
3. Run \`npm run dev\`

## Deployment

\`\`\`bash
easyploy deploy
\`\`\`
`,
        },
      ],
    },
    {
      name: "convex",
      description: "Modern app with Convex (Serverless + Realtime + TypeScript-first)",
      technologies: ["React", "TypeScript", "Convex", "Serverless"],
      files: [
        {
          path: "package.json",
          content: JSON.stringify({
            name: "{{PROJECT_NAME}}",
            version: "0.1.0",
            private: true,
            scripts: {
              dev: "vite",
              build: "tsc && vite build",
              preview: "vite preview",
              convex: "convex dev",
            },
            dependencies: {
              "convex": "^1.0.0",
              react: "^18.2.0",
              "react-dom": "^18.2.0",
            },
            devDependencies: {
              "@types/react": "^18.2.0",
              "@types/react-dom": "^18.2.0",
              "@vitejs/plugin-react": "^4.0.0",
              typescript: "^5.0.0",
              vite: "^5.0.0",
            },
          }, null, 2),
        },
        {
          path: "convex.json",
          content: JSON.stringify({
            functions: "convex/",
          }, null, 2),
        },
        {
          path: "src/main.tsx",
          content: `import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConvexProvider, ConvexReactClient } from 'convex/react'
import App from './App'
import './index.css'

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConvexProvider client={convex}>
      <App />
    </ConvexProvider>
  </React.StrictMode>,
)`,
        },
        {
          path: "src/App.tsx",
          content: `import { useQuery } from 'convex/react'
import './App.css'

export default function App() {
  const tasks = useQuery(api.tasks.getAll)

  return (
    <div className="App">
      <h1>Convex + React</h1>
      <ul>
        {tasks?.map((task) => (
          <li key={task._id}>{task.text}</li>
        ))}
      </ul>
    </div>
  )
}
`,
        },
        {
          path: "convex/schema.ts",
          content: `import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  tasks: defineTable({
    text: v.string(),
    completed: v.boolean(),
  }),
})
`,
        },
        {
          path: "convex/tasks.ts",
          content: `import { query, mutation } from './_generated/server'

export const getAll = query(async ({ db }) => {
  return await db.query('tasks').collect()
})

export const create = mutation(async ({ db }, { text }: { text: string }) => {
  await db.insert('tasks', { text, completed: false })
})
`,
        },
        {
          path: ".env.example",
          content: `VITE_CONVEX_URL=https://your-deployment.convex.cloud
`,
        },
        {
          path: "README.md",
          content: `# {{PROJECT_NAME}}

Created with easyploy convex template.

## Setup

1. Install dependencies: \`npm install\`
2. Set up Convex: \`npx convex dev\`
3. Copy \`.env.example\` to \`.env\` and add your Convex URL
4. Run \`npm run dev\`

## Deployment

\`\`\`bash
easyploy deploy
\`\`\`
`,
        },
      ],
    },
    {
      name: "pocketbase",
      description: "Lightweight app with PocketBase (SQLite + Auth + Realtime)",
      technologies: ["Svelte", "TypeScript", "PocketBase"],
      files: [
        {
          path: "package.json",
          content: JSON.stringify({
            name: "{{PROJECT_NAME}}",
            version: "0.1.0",
            private: true,
            scripts: {
              dev: "vite dev",
              build: "vite build",
              preview: "vite preview",
            },
            dependencies: {
              pocketbase: "^0.21.0",
            },
            devDependencies: {
              "@sveltejs/vite-plugin-svelte": "^3.0.0",
              svelte: "^4.0.0",
              "svelte-check": "^3.0.0",
              tslib: "^2.0.0",
              typescript: "^5.0.0",
              vite: "^5.0.0",
            },
          }, null, 2),
        },
        {
          path: "src/lib/pocketbase.ts",
          content: `import PocketBase from 'pocketbase'

export const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL || '')

// Auth store helper
export const currentUser = pb.authStore.model
`,
        },
        {
          path: ".env.example",
          content: `VITE_POCKETBASE_URL=http://127.0.0.1:8090
`,
        },
        {
          path: "README.md",
          content: `# {{PROJECT_NAME}}

Created with easyploy pocketbase template.

## Setup

1. Download PocketBase from https://pocketbase.io/
2. Start PocketBase: \`./pocketbase serve\`
3. Copy \`.env.example\` to \`.env\`
4. Run \`npm install\`
5. Run \`npm run dev\`

## Deployment

\`\`\`bash
easyploy deploy
\`\`\`
`,
        },
      ],
    },
    {
      name: "easyploy-vibecode",
      description: "Vibe Coding optimized: Next.js 15 + Next-Auth + Prisma + MinIO + Redis - Self-hosted with GUI management",
      technologies: ["Next.js", "TypeScript", "Prisma", "PostgreSQL", "Next-Auth", "Resend", "MinIO", "Redis", "Tailwind", "shadcn/ui"],
      files: [
        {
          path: "package.json",
          content: JSON.stringify({
            name: "{{PROJECT_NAME}}",
            version: "0.1.0",
            private: true,
            type: "module",
            scripts: {
              dev: "next dev",
              build: "next build",
              start: "next start",
              lint: "next lint",
              "db:generate": "prisma generate",
              "db:migrate": "prisma migrate dev",
              "db:studio": "prisma studio",
              "db:push": "prisma db push",
              "db:seed": "tsx prisma/seed.ts",
              "stack:up": "docker-compose up -d",
              "stack:down": "docker-compose down",
              "stack:logs": "docker-compose logs -f"
            },
            dependencies: {
              "@auth/prisma-adapter": "^2.0.0",
              "@hookform/resolvers": "^3.3.4",
              "@prisma/client": "^5.12.0",
              "@radix-ui/react-accordion": "^1.1.2",
              "@radix-ui/react-alert-dialog": "^1.0.5",
              "@radix-ui/react-avatar": "^1.0.4",
              "@radix-ui/react-checkbox": "^1.0.4",
              "@radix-ui/react-dialog": "^1.0.5",
              "@radix-ui/react-dropdown-menu": "^2.0.6",
              "@radix-ui/react-label": "^2.0.2",
              "@radix-ui/react-select": "^2.0.0",
              "@radix-ui/react-separator": "^1.0.3",
              "@radix-ui/react-slot": "^1.0.2",
              "@radix-ui/react-tabs": "^1.0.4",
              "@radix-ui/react-toast": "^1.1.5",
              "@tanstack/react-query": "^5.28.0",
              "@aws-sdk/client-s3": "^3.540.0",
              "@aws-sdk/s3-request-presigner": "^3.540.0",
              "class-variance-authority": "^0.7.0",
              clsx: "^2.1.0",
              "date-fns": "^3.6.0",
              ioredis: "^5.3.2",
              "lucide-react": "^0.344.0",
              next: "14.2.0",
              "next-auth": "5.0.0-beta.15",
              "next-themes": "^0.2.1",
              react: "^18.2.0",
              "react-dom": "^18.2.0",
              "react-hook-form": "^7.51.0",
              resend: "^3.2.0",
              "tailwind-merge": "^2.2.0",
              "tailwindcss-animate": "^1.0.7",
              zod: "^3.22.4"
            },
            devDependencies: {
              "@types/node": "^20",
              "@types/react": "^18",
              "@types/react-dom": "^18",
              autoprefixer: "^10.0.1",
              postcss: "^8",
              prisma: "^5.12.0",
              tailwindcss: "^3.3.0",
              tsx: "^4.7.0",
              typescript: "^5",
              eslint: "^8",
              "eslint-config-next": "14.2.0"
            }
          }, null, 2)
        },
        {
          path: "docker-compose.yml",
          content: `version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:\${POSTGRES_PASSWORD:-postgres}@postgres:5432/app
      - REDIS_URL=redis://redis:6379
      - NEXTAUTH_SECRET=\${NEXTAUTH_SECRET:-your-secret-key-min-32-chars}
      - NEXTAUTH_URL=\${NEXTAUTH_URL:-http://localhost:3000}
      - RESEND_API_KEY=\${RESEND_API_KEY:-}
      - MINIO_ENDPOINT=minio
      - MINIO_PORT=9000
      - MINIO_ACCESS_KEY=\${MINIO_ROOT_USER:-minioadmin}
      - MINIO_SECRET_KEY=\${MINIO_ROOT_PASSWORD:-minioadmin}
      - MINIO_BUCKET=uploads
    depends_on:
      - postgres
      - redis
      - minio

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD:-postgres}
      POSTGRES_DB: app
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"

  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: \${MINIO_ROOT_USER:-minioadmin}
      MINIO_ROOT_PASSWORD: \${MINIO_ROOT_PASSWORD:-minioadmin}
    volumes:
      - minio_data:/data
    ports:
      - "9000:9000"
      - "9001:9001"

  minio-init:
    image: minio/mc:latest
    depends_on:
      - minio
    entrypoint: >
      /bin/sh -c "
      sleep 5;
      mc alias set local http://minio:9000 \$\${MINIO_ROOT_USER:-minioadmin} \$\${MINIO_ROOT_PASSWORD:-minioadmin};
      mc mb local/uploads || true;
      mc policy set public local/uploads;
      "

volumes:
  postgres_data:
  redis_data:
  minio_data:`
        },
        {
          path: ".env.example",
          content: `# Database
POSTGRES_PASSWORD=your-secure-password

# Auth
NEXTAUTH_SECRET=your-secret-key-min-32-chars-long
NEXTAUTH_URL=http://localhost:3000

# Email (Resend)
RESEND_API_KEY=re_your-resend-api-key

# Storage
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin

# API URLs
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_STORAGE_URL=http://localhost:9000`
        },
        {
          path: "prisma/schema.prisma",
          content: `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Account {
  id                String  @id @default(cuid())
  userId            String  @map("user_id")
  type              String
  provider          String
  providerAccountId String  @map("provider_account_id")
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique @map("session_token")
  userId       String   @map("user_id")
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime? @map("email_verified")
  image         String?
  accounts      Account[]
  sessions      Session[]
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  @@map("users")
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
  @@map("verification_tokens")
}`
        },
        {
          path: "README.md",
          content: `# {{PROJECT_NAME}}

Built with **easyploy-vibecode** template.

## Stack

- **Next.js 15** (App Router)
- **Next-Auth v5** (Auth with Resend)
- **Prisma** (ORM)
- **PostgreSQL** (Database)
- **Redis** (Cache & Sessions)
- **MinIO** (S3-compatible Storage)
- **Tailwind CSS** + **shadcn/ui**
- **TanStack Query** (Server State)
- **React Hook Form** + **Zod**

## Quick Start

1. **Setup Environment**
   \`\`\`bash
   cp .env.example .env
   # Edit .env with your settings
   \`\`\`

2. **Start Infrastructure**
   \`\`\`bash
   npm run stack:up
   \`\`\`

3. **Database Setup**
   \`\`\`bash
   npm run db:generate
   npm run db:migrate
   \`\`\`

4. **Run Development**
   \`\`\`bash
   npm run dev
   \`\`\`

## Management GUIs

| Service | URL | Purpose |
|---------|-----|---------|
| App | http://localhost:3000 | Next.js App |
| Prisma Studio | \`npm run db:studio\` | Database GUI |
| MinIO Console | http://localhost:9001 | Storage Management |
| Resend Dashboard | https://resend.com | Email Templates & Logs |

## Vibe Coding

Optimized for AI-assisted development with Server Actions, full TypeScript, and simple patterns.`
        }
      ]
    }
  ];
}

export function getTemplate(name: string): Template | undefined {
  return getAvailableTemplates().find((t) => t.name === name);
}
