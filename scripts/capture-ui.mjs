import { chromium } from '@playwright/test'
import { mkdir } from 'node:fs/promises'

const state = {
  version: 1,
  alarms: [
    {
      id: 'visual-1', label: 'Bom dia, meu amor', time: '07:30', days: [1, 2, 3, 4, 5], enabled: true,
      audio: { name: 'voz-da-manha.webm', mimeType: 'audio/webm', dataUrl: 'data:audio/webm;base64,AAAA', durationSeconds: 16 },
      outputDeviceId: 'default', outputDeviceLabel: 'Caixas de som (Realtek)', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z'
    },
    {
      id: 'visual-2', label: 'Hora de descansar', time: '22:45', days: [0, 1, 2, 3, 4, 5, 6], enabled: false,
      audio: { name: 'boa-noite.webm', mimeType: 'audio/webm', dataUrl: 'data:audio/webm;base64,AAAA', durationSeconds: 12 },
      outputDeviceId: 'default', outputDeviceLabel: 'Fone Bluetooth', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z'
    }
  ],
  settings: { quietUntil: null, launchAtStartup: true, sync: { enabled: false, databaseUrl: '', syncKey: 'alarme-casal' } },
  updatedAt: '2026-01-01T00:00:00.000Z'
}

await mkdir('artifacts', { recursive: true })
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1180, height: 760 }, deviceScaleFactor: 1 })
await page.addInitScript((value) => localStorage.setItem('alarmebin-state-v1', JSON.stringify(value)), state)
await page.goto('http://127.0.0.1:4173')
await page.getByText('Bom dia, meu amor').waitFor()
await page.screenshot({ path: 'artifacts/dashboard.png' })
await page.getByRole('button', { name: 'Editar Bom dia, meu amor' }).click()
await page.screenshot({ path: 'artifacts/editor.png' })
await browser.close()
