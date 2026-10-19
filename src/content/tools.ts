import type { ToolMark } from './schema'

const mark = (name: string, file: string, mono?: true): ToolMark => ({ name, logo: `/images/tools/${file}`, mono })

/**
 * Every tool logo the site can show. Pages reference these, never a raw path. The marks are
 * Simple Icons (CC0) in each brand's color. A black one-colour logo takes a third argument, `true`,
 * so it is inverted on dark grounds and never disappears.
 */
export const tools = {
  vscode: mark('VS Code', 'vscode.svg'),
  git: mark('Git', 'git.svg'),
  github: mark('GitHub', 'github.svg', true),
  claude: mark('Claude Code', 'claude.svg'),
  claudeApi: mark('Claude API', 'claude.svg'),
  vite: mark('Vite', 'vite.svg'),
  react: mark('React', 'react.svg'),
  typescript: mark('TypeScript', 'typescript.svg'),
  python: mark('Python', 'python.svg'),
  node: mark('Node.js', 'nodejs.svg'),
  postgres: mark('PostgreSQL', 'postgresql.svg'),
  supabase: mark('Supabase', 'supabase.svg'),
  premiere: mark('Premiere Pro', 'premiere-pro.svg'),
  afterEffects: mark('After Effects', 'after-effects.svg'),
} satisfies Record<string, ToolMark>
