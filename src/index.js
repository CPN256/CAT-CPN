import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const pkg = path.join(root, 'package.json')
const require = createRequire(import.meta.url)

function baileysInstalled() {
  try {
    require.resolve('@whiskeysockets/baileys')
    return true
  } catch {
    return false
  }
}

function runNpm(args) {
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
  return spawnSync(npm, args, {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, NPM_CONFIG_AUDIT: 'false', NPM_CONFIG_FUND: 'false' }
  })
}

if (!fs.existsSync(pkg)) {
  console.error('[CAT CPN] package.json was not found. Upload/extract the complete ZIP and start again.')
  process.exit(1)
}

if (!baileysInstalled()) {
  console.log('\n╔══════════════════════════════════════════════════════╗')
  console.log('║             👑 CAT CPN INSTALLER 👑                ║')
  console.log('╠══════════════════════════════════════════════════════╣')
  console.log('║ Baileys 7.0.0-rc14 is not installed.               ║')
  console.log('║ Installing dependencies before starting the bot...  ║')
  console.log('╚══════════════════════════════════════════════════════╝\n')

  // npm 12 can block Git dependencies unless explicitly permitted. The
  // current Baileys release is published to npm, but keeping this setting
  // makes the bootstrap compatible with dependency trees that still expose
  // Git URLs on restricted panel images.
  runNpm(['config', 'set', 'allow-git', 'all', '--location=project'])

  const result = runNpm([
    'install',
    '@whiskeysockets/baileys@7.0.0-rc14',
    'pino@9.7.0',
    '--save-exact',
    '--no-audit',
    '--no-fund',
    '--prefer-online'
  ])

  if (result.error) {
    console.error(`\n[CAT CPN] npm could not start: ${result.error.message}`)
    process.exit(1)
  }

  if (result.status !== 0 || !baileysInstalled()) {
    console.error(`\n[CAT CPN] Dependency installation failed (exit code ${result.status ?? 'unknown'}).`)
    console.error('[CAT CPN] The npm output immediately above contains the real reason.')
    console.error('[CAT CPN] If this repeats, check that the Pterodactyl container has outbound npm/network access.')
    process.exit(result.status || 1)
  }

  console.log('\n[CAT CPN] ✓ Baileys installed successfully. Starting CAT CPN...\n')
}

await import('./bot.js')
