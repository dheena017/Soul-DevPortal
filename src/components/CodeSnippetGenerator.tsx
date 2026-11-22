import React, { useState } from 'react';
import CopyButton from './CopyButton';

interface SnippetItem {
  id: string;
  title: string;
  language: string;
  filename: string;
  code: string;
}

const SNIPPET_TEMPLATES: Record<string, SnippetItem[]> = {
  config: [
    {
      id: 'react-vite',
      title: 'React / Vite tsconfig',
      language: 'json',
      filename: 'tsconfig.json',
      code: `{
  "extends": "@workspace/config/tsconfig/react.json",
  "include": ["src"]
}`,
    },
    {
      id: 'nextjs',
      title: 'Next.js App Router tsconfig',
      language: 'json',
      filename: 'tsconfig.json',
      code: `{
  "extends": "@workspace/config/tsconfig/next.json",
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"]
}`,
    },
    {
      id: 'node-express',
      title: 'Node.js / Express tsconfig',
      language: 'json',
      filename: 'tsconfig.json',
      code: `{
  "extends": "@workspace/config/tsconfig/node.json",
  "include": ["src"]
}`,
    },
    {
      id: 'tailwind',
      title: 'Tailwind CSS preset',
      language: 'javascript',
      filename: 'tailwind.config.js',
      code: `import workspacePreset from '@workspace/config/tailwind/preset';

export default {
  presets: [workspacePreset],
  content: ['./src/**/*.{html,js,jsx,ts,tsx}'],
};`,
    },
    {
      id: 'prettier',
      title: 'Prettier Configuration',
      language: 'json',
      filename: '.prettierrc.json',
      code: `"@workspace/config/prettier"`,
    },
  ],
  logger: [
    {
      id: 'client-react',
      title: 'Browser & React Logging',
      language: 'typescript',
      filename: 'src/App.tsx',
      code: `import { consoleLogger } from '@workspace/logger';

// Colored structured logging in browser console
consoleLogger.info('AUTH', 'User session established', { userId: 42 });
consoleLogger.action('CART', 'Item added to checkout');
consoleLogger.error('API', 'Payment gateway timeout', new Error('Timeout'));`,
    },
    {
      id: 'node-backend',
      title: 'Node.js / Express Backend Logging',
      language: 'typescript',
      filename: 'server/index.ts',
      code: `import { serverLogger } from '@workspace/logger';

serverLogger.info('HTTP', 'Server listening on http://localhost:8000');
serverLogger.action('DB', 'Connected to PostgreSQL database');
serverLogger.success('INIT', 'All microservices healthy');`,
    },
    {
      id: 'python-backend',
      title: 'Python FastAPI / Backend Logging',
      language: 'python',
      filename: 'backend/main.py',
      code: `from workspace_logger import get_logger

logger = get_logger("API")

@app.get("/health")
def health():
    logger.info("Health check ping received")
    return {"status": "ok"}`,
    },
    {
      id: 'vite-banner',
      title: 'Vite Plugin & Dev Banner',
      language: 'javascript',
      filename: 'vite.config.ts',
      code: `import { defineConfig } from 'vite';
import { workspaceLoggerPlugin } from '@workspace/logger/vite-plugin';

export default defineConfig({
  plugins: [workspaceLoggerPlugin()],
});`,
    },
  ],
  runner: [
    {
      id: 'cli-all',
      title: 'CLI: Run All Monorepo Projects',
      language: 'bash',
      filename: 'Terminal Command',
      code: `# Launch full stack across all projects concurrently
npx @workspace/runner all

# Launch specific project (e.g. apexmind-ai)
npx @workspace/runner project apexmind-ai`,
    },
    {
      id: 'cli-ports',
      title: 'CLI: Inspect Port Allocations',
      language: 'bash',
      filename: 'Terminal Command',
      code: `# Check port conflicts and assigned dev ports
npx @workspace/runner ports`,
    },
    {
      id: 'python-runner',
      title: 'Python Programmatic Runner',
      language: 'python',
      filename: 'scripts/run_cluster.py',
      code: `from workspace_runner import run_project, get_all_projects

projects = get_all_projects()
print(f"Total projects managed: {len(projects)}")

run_project("apexmind-ai", background=True)`,
    },
  ],
};

export interface CodeSnippetGeneratorProps {
  pkgId: string;
}

export default function CodeSnippetGenerator({ pkgId }: CodeSnippetGeneratorProps) {
  const snippets = SNIPPET_TEMPLATES[pkgId] || [];
  const [selectedId, setSelectedId] = useState<string>(snippets[0]?.id || '');

  if (!snippets.length) return null;

  const activeSnippet = snippets.find((s) => s.id === selectedId) || snippets[0];

  return (
    <div className="snippet-generator-card">
      <div className="snippet-generator-header">
        <div className="snippet-header-copy">
          <span className="section-kicker">QUICK INTEGRATION</span>
          <h3>Integration Code Generator</h3>
          <p>Select your framework or target environment to copy ready-to-run setup code.</p>
        </div>
      </div>

      <div className="snippet-pills-row" role="tablist" aria-label="Snippet frameworks">
        {snippets.map((snippet) => (
          <button
            type="button"
            key={snippet.id}
            role="tab"
            aria-selected={snippet.id === activeSnippet.id}
            className={`snippet-pill ${snippet.id === activeSnippet.id ? 'active' : ''}`}
            onClick={() => setSelectedId(snippet.id)}
          >
            {snippet.title}
          </button>
        ))}
      </div>

      <div className="snippet-code-box">
        <div className="snippet-code-topbar">
          <div className="snippet-filename">
            <span className="snippet-lang-tag">{activeSnippet.language}</span>
            <code>{activeSnippet.filename}</code>
          </div>
          <CopyButton text={activeSnippet.code} />
        </div>
        <pre className="snippet-pre">
          <code>{activeSnippet.code}</code>
        </pre>
      </div>
    </div>
  );
}
