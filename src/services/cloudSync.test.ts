import { describe, expect, it, vi } from 'vitest'
import { newestState, pullCloudState, pushCloudState } from './cloudSync'
import { stateFixture } from '../test/fixtures'

const settings = { enabled: true, databaseUrl: 'https://casal-default-rtdb.firebaseio.com/', syncKey: 'Meu Amor!' }

describe('sincronização Firebase', () => {
  it('baixa do caminho isolado pela chave normalizada', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => stateFixture }))
    await expect(pullCloudState(settings)).resolves.toEqual(stateFixture)
    expect(fetch).toHaveBeenCalledWith('https://casal-default-rtdb.firebaseio.com/alarmebin/meu-amor.json', expect.anything())
  })

  it('envia todo o estado via PUT', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }))
    await pushCloudState(settings, stateFixture)
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/alarmebin/'), expect.objectContaining({ method: 'PUT', body: JSON.stringify(stateFixture) }))
  })

  it('rejeita URL inválida e respostas sem sucesso', async () => {
    await expect(pullCloudState({ ...settings, databaseUrl: 'http://inseguro.local' })).rejects.toThrow('URL do Firebase inválida')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401 }))
    await expect(pullCloudState(settings)).rejects.toThrow('401')
  })

  it('escolhe o estado mais recente', () => {
    const cloud = { ...stateFixture, updatedAt: '2027-01-01T00:00:00.000Z' }
    expect(newestState(stateFixture, cloud)).toBe(cloud)
    expect(newestState(stateFixture, null)).toBe(stateFixture)
  })
})
