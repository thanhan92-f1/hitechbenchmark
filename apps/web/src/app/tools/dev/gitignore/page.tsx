'use client'

import { useState } from 'react'
import { ToolPageShell } from '@/components/tools/ToolPageShell'
import { Copy, Check } from 'lucide-react'

const TEMPLATES: Record<string, string> = {
  'Node.js': `# Node.js
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
.pnpm-store/
.npm
.yarn/cache
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
dist/
build/
.next/
.nuxt/
.cache/
*.log`,

  'Python': `# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
.venv/
pip-wheel-metadata/
*.egg-info/
dist/
build/
*.egg
.eggs/
.pytest_cache/
.coverage
htmlcov/
.mypy_cache/
.ruff_cache/`,

  'Go': `# Go
*.exe
*.exe~
*.dll
*.so
*.dylib
*.test
*.out
go.work.sum
vendor/`,

  'Rust': `# Rust
/target/
Cargo.lock
**/*.rs.bk
*.pdb`,

  'Java': `# Java
*.class
*.log
*.jar
*.war
*.nar
*.ear
*.zip
*.tar.gz
*.rar
hs_err_pid*
replay_pid*
target/
.mvn/wrapper/maven-wrapper.jar`,

  'Laravel / PHP': `# Laravel
/vendor/
/node_modules/
/public/hot
/public/storage
/storage/*.key
.env
.env.backup
.phpunit.result.cache
Homestead.json
Homestead.yaml
npm-debug.log
yarn-error.log`,

  'macOS': `# macOS
.DS_Store
.AppleDouble
.LSOverride
._*
.Spotlight-V100
.Trashes
.fseventsd`,

  'Windows': `# Windows
Thumbs.db
ehthumbs.db
ehthumbs_vista.db
*.lnk
Desktop.ini
$RECYCLE.BIN/`,

  'JetBrains IDEs': `# JetBrains
.idea/
*.iws
*.iml
*.ipr
out/
.idea_modules/`,

  'VS Code': `# VS Code
.vscode/*
!.vscode/settings.json
!.vscode/tasks.json
!.vscode/launch.json
!.vscode/extensions.json`,

  'Docker': `# Docker
.dockerignore
docker-compose.override.yml`,
}

export default function GitignorePage() {
  const [selected, setSelected] = useState<string[]>([])
  const [copied, setCopied] = useState(false)

  const content = selected.map(k => TEMPLATES[k]).join('\n\n')

  const copy = () => {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const download = () => {
    const blob = new Blob([content], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = '.gitignore'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const toggle = (k: string) => setSelected(prev => prev.includes(k) ? prev.filter(x => x !== k) : [...prev, k])

  return (
    <ToolPageShell groupId="dev" groupLabel="Developer Tools" groupHref="/tools/dev" groupColor="orange"
      toolLabel=".gitignore Generator" description="Generate .gitignore files for your project by selecting the technologies you use.">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Select technologies</label>
          <div className="flex flex-wrap gap-2">
            {Object.keys(TEMPLATES).map(k => (
              <button key={k} onClick={() => toggle(k)}
                className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${selected.includes(k)
                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300'
                  : 'border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-orange-300'
                }`}>
                {k}
              </button>
            ))}
          </div>
        </div>

        {content && (
          <>
            <div className="flex gap-2">
              <button onClick={copy} className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button onClick={download} className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                Download .gitignore
              </button>
            </div>
            <pre className="p-4 rounded-xl bg-gray-950 text-gray-100 text-xs font-mono overflow-auto max-h-96 border border-gray-800">
              {content}
            </pre>
          </>
        )}
      </div>
    </ToolPageShell>
  )
}
