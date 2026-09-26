import { emptyState } from '../domain/alarm'
import type { PersistedState } from '../types'

const STORE_NAME = 'state'
const FALLBACK_KEY = 'alarmebin-state-v1'

function isPersistedState(value: unknown): value is PersistedState {
  if (!value || typeof value !== 'object') return false
  const state = value as Partial<PersistedState>
  return state.version === 1 && Array.isArray(state.alarms) && !!state.settings
}

export async function loadState(): Promise<PersistedState> {
  try {
    const value = window.alarmDesktop
      ? await window.alarmDesktop.readStore(STORE_NAME)
      : JSON.parse(localStorage.getItem(FALLBACK_KEY) ?? 'null')
    return isPersistedState(value) ? value : emptyState()
  } catch {
    return emptyState()
  }
}

export async function saveState(state: PersistedState) {
  if (window.alarmDesktop) await window.alarmDesktop.writeStore(STORE_NAME, state)
  else localStorage.setItem(FALLBACK_KEY, JSON.stringify(state))
}
