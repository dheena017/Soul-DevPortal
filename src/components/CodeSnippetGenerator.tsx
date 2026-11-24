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
      filename: 'server/main.py',
      code: `from logger.external import get_logger

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
      code: `from runner.external import run_single_process

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
    <div className="w-full flex flex-col gap-4 p-5 md:p-6 rounded-2xl bg-[#111111] border border-[#222222] shadow-2xl">
      <div className="flex flex-col gap-1 pb-3 border-b border-[#1a1a1a]">
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-400">
          QUICK INTEGRATION
        </span>
        <h3 className="text-lg font-bold text-white">Integration Code Generator</h3>
        <p className="text-xs text-neutral-400">
          Select your framework or target environment to copy ready-to-run setup code.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#0a0a0a] border border-[#222222] rounded-xl" role="tablist" aria-label="Snippet frameworks">
        {snippets.map((snippet) => (
          <button
            type="button"
            key={snippet.id}
            role="tab"
            aria-selected={snippet.id === activeSnippet.id}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              snippet.id === activeSnippet.id
                ? 'bg-blue-600 text-white shadow-md border border-blue-500'
                : 'text-neutral-400 hover:text-white hover:bg-[#111111]'
            }`}
            onClick={() => setSelectedId(snippet.id)}
          >
            {snippet.title}
          </button>
        ))}
      </div>

      <div className="rounded-xl bg-[#0a0a0a] border border-[#222222] overflow-hidden shadow-lg">
        <div className="flex items-center justify-between px-3.5 py-2 bg-[#111111] border-b border-[#1a1a1a] text-xs">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/25">
              {activeSnippet.language}
            </span>
            <code className="text-[11px] font-mono text-neutral-300">{activeSnippet.filename}</code>
          </div>
          <CopyButton text={activeSnippet.code} variant="compact" />
        </div>
        <pre className="p-4 text-xs font-mono text-neutral-300 leading-relaxed overflow-x-auto whitespace-pre">
          <code>{activeSnippet.code}</code>
        </pre>
      </div>
    </div>
  );
}
