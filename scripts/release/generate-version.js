import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function resolveCommit() {
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim()
  } catch {
    return 'unknown'
  }
}

const pkg = readJson('package.json')
const versionMetadata = {
  name: pkg.name,
  version: pkg.version,
  commit: resolveCommit(),
  builtAt: new Date().toISOString(),
}

fs.mkdirSync('public', { recursive: true })
fs.writeFileSync(
  path.join('public', 'version.json'),
  `${JSON.stringify(versionMetadata, null, 2)}\n`,
)
