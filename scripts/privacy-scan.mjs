import { readdir, readFile, stat } from 'node:fs/promises'
import { basename, join, relative } from 'node:path'

const roots = ['.']
const ignoredDirectories = new Set(['.git', 'node_modules', 'coverage', 'playwright-report', 'test-results', '.supabase'])
const configuredStrings = (process.env.PRIVACY_FORBIDDEN_STRINGS ?? '').split(',').map((value) => value.trim()).filter(Boolean)
const forbidden = [
  /C:\\Users\\/i,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/,
  /service[_-]?role[_-]?key\s*[:=]\s*['\"][^'\"]{20,}/i,
  ...configuredStrings.map((value) => new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')),
]
const allowed = new Set(['docs/COMMIT_PRIVACY_AUDIT.md'])
const findings = []

async function files(path) {
  const info = await stat(path)
  if (info.isFile()) return [path]
  if (ignoredDirectories.has(basename(path))) return []
  const entries = await readdir(path)
  const nested = await Promise.all(entries.map((entry) => files(join(path, entry))))
  return nested.flat()
}

for (const root of roots) {
  try {
    for (const file of await files(root)) {
      const rel = relative('.', file).replaceAll('\\', '/')
      if (allowed.has(rel) || /\.(png|jpg|jpeg|gif|woff2?)$/i.test(file)) continue
      const text = await readFile(file, 'utf8')
      forbidden.forEach((pattern) => {
        if (pattern.test(text)) findings.push(`${rel}: ${pattern}`)
      })
    }
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error
  }
}

if (findings.length) {
  console.error(findings.join('\n'))
  process.exit(1)
}
console.log('Privacy scan passed: no configured personal identifiers or secret patterns found.')
