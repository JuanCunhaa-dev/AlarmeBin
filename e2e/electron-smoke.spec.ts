import { _electron as electron, expect, test } from '@playwright/test'
import { join } from 'node:path'
import { existsSync } from 'node:fs'

test('abre no Electron com a ponte desktop funcionando', async () => {
  const env = { ...process.env }
  delete env.ELECTRON_RUN_AS_NODE
  const packagedExecutable = join(process.cwd(), 'release/win-unpacked/AlarmeBin.exe')
  const isolatedProfile = join(process.cwd(), 'test-results/electron-profile')
  const app = existsSync(packagedExecutable)
    ? await electron.launch({ executablePath: packagedExecutable, args: [`--user-data-dir=${isolatedProfile}`], env: env as Record<string, string> })
    : await electron.launch({ args: [join(process.cwd(), 'dist-electron/main.js'), `--user-data-dir=${isolatedProfile}`], env: env as Record<string, string> })
  try {
    const window = await app.firstWindow()
    await expect(window.getByText('ALARME', { exact: false }).first()).toBeVisible()
    await expect.poll(() => window.evaluate(() => typeof window.alarmDesktop?.writeStore)).toBe('function')
  } finally {
    await app.close()
  }
})
