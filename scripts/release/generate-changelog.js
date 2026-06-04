import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function runGit(args) {
  try {
    return execFileSync('git', args, { encoding: 'utf8' }).trim()
  } catch {
    return ''
  }
}

function resolveCommitRange() {
  const latestTag = runGit(['describe', '--tags', '--abbrev=0'])
  return latestTag ? `${latestTag}..HEAD` : 'HEAD'
}

function resolveCommitSubjects() {
  const range = resolveCommitRange()
  const output = runGit(['log', range, '--pretty=format:%s'])

  if (!output) {
    return ['No commit summary available.']
  }

  return output
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

const pkg = readJson('package.json')
const today = new Date().toISOString().slice(0, 10)
const heading = `## v${pkg.version} - ${today}`
const changelogPath = 'CHANGELOG.md'
const existing = fs.existsSync(changelogPath) ? fs.readFileSync(changelogPath, 'utf8') : ''

if (existing.includes(heading)) {
  process.exit(0)
}

const entry = [
  heading,
  '',
  ...resolveCommitSubjects().map((subject) => `- ${subject}`),
  '',
].join('\n')

const nextContent = existing.trim() ? `${entry}\n${existing.trim()}\n` : `# Changelog\n\n${entry}\n`
fs.writeFileSync(changelogPath, nextContent)
