import { copyFile, mkdir } from 'node:fs/promises'

const source = new URL('../dist/index.html', import.meta.url)
await copyFile(source, new URL('../dist/404.html', import.meta.url))

const staticRoutes = [
  'submit', 'request-faculty', 'admin', 'auth/callback', 'guidelines', 'privacy',
  'moderation-policy', 'corrections', 'methodology', 'limitations', 'contact',
]

for (const route of staticRoutes) {
  const directory = new URL(`../dist/${route}/`, import.meta.url)
  await mkdir(directory, { recursive: true })
  await copyFile(source, new URL('index.html', directory))
}
