import { describe, expect, it, vi } from 'vitest'
import { loadState, saveState } from './persistence'
import { stateFixture } from '../test/fixtures'

describe('persistência', () => {
  it('salva e carrega pelo armazenamento local no navegador', async () => {
    await saveState(stateFixture)
    await expect(loadState()).resolves.toEqual(stateFixture)
  })

  it('usa a ponte segura do Electron quando disponível', async () => {
    const writeStore = vi.fn().mockResolvedValue(undefined)
    const readStore = vi.fn().mockResolvedValue(stateFixture)
    window.alarmDesktop = { writeStore, readStore, setStartup: vi.fn(), getStartup: vi.fn(), alarmStarted: vi.fn(), alarmStopped: vi.fn(), platform: 'win32' }
    await saveState(stateFixture)
    expect(writeStore).toHaveBeenCalledWith('state', stateFixture)
    await expect(loadState()).resolves.toEqual(stateFixture)
  })

  it('recupera estado vazio ao ler conteúdo corrompido', async () => {
    localStorage.setItem('alarmebin-state-v1', '{')
    const state = await loadState()
    expect(state.alarms).toEqual([])
    expect(state.version).toBe(1)
  })
})
