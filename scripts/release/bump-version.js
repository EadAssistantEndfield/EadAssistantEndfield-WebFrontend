import { execSync } from 'node:child_process'
import fs from 'node:fs'
import { computeMainVersion } from './compute-release-version.mjs'

function run(command) {
  execSync(command, { stdio: 'inherit' })
}

try {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))
  const newVersion = computeMainVersion(pkg.version)

  pkg.version = newVersion
  fs.writeFileSync('package.json', `${JSON.stringify(pkg, null, 2)}\n`)

  run('npm install --package-lock-only --ignore-scripts')
  run('npm run changelog')
  run('node scripts/release/generate-version.js')

  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `new_version=${newVersion}\n`)
  }

  console.log(`New version: ${newVersion}`)
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
}
