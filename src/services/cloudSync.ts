import { sanitizeSyncKey } from '../domain/alarm'
import type { PersistedState, SyncSettings } from '../types'

function endpoint(settings: SyncSettings) {
  const base = settings.databaseUrl.trim().replace(/\/$/, '')
  const key = sanitizeSyncKey(settings.syncKey)
  if (!/^https:\/\/[a-z0-9-]+(?:-default-rtdb)?\.[a-z0-9.-]+$/i.test(base)) {
    throw new Error('URL do Firebase inválida.')
  }
  if (!key) throw new Error('Informe uma chave de sincronização.')
  return `${base}/alarmebin/${key}.json`
}

export async function pullCloudState(settings: SyncSettings): Promise<PersistedState | null> {
  const response = await fetch(endpoint(settings), { headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error(`Firebase respondeu ${response.status}. Verifique as regras do banco.`)
  return (await response.json()) as PersistedState | null
}

export async function pushCloudState(settings: SyncSettings, state: PersistedState) {
  const response = await fetch(endpoint(settings), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(state)
  })
  if (!response.ok) throw new Error(`Firebase respondeu ${response.status}. Verifique as regras do banco.`)
}

export function newestState(local: PersistedState, cloud: PersistedState | null) {
  if (!cloud || cloud.version !== 1 || !Array.isArray(cloud.alarms)) return local
  return new Date(cloud.updatedAt).getTime() > new Date(local.updatedAt).getTime() ? cloud : local
}
