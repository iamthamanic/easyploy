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
  ];
}

export function getTemplate(name: string): Template | undefined {
  return getAvailableTemplates().find((t) => t.name === name);
}
