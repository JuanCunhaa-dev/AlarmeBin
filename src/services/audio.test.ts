import { describe, expect, it, vi } from 'vitest'
import { AlarmPlayback, getAudioOutputs } from './audio'
import { alarmFixture } from '../test/fixtures'

class FakeAudio extends EventTarget {
  src = ''
  preload = ''
  currentTime = 0
  play = vi.fn(async () => { queueMicrotask(() => this.dispatchEvent(new Event('ended'))) })
  pause = vi.fn()
  setSinkId = vi.fn(async () => undefined)
}

describe('reprodução de alarme', () => {
  it('seleciona a saída e toca ciclos completos suficientes', async () => {
    const audio = new FakeAudio()
    const progress = vi.fn()
    const player = new AlarmPlayback(audio as unknown as HTMLAudioElement)
    await player.play(alarmFixture, progress)
    expect(audio.setSinkId).toHaveBeenCalledWith('speakers-1')
    expect(audio.play).toHaveBeenCalledTimes(2)
    expect(progress).toHaveBeenNthCalledWith(1, 1, 2)
    expect(progress).toHaveBeenNthCalledWith(2, 2, 2)
  })

  it('para imediatamente sem iniciar outro ciclo', async () => {
    const audio = new FakeAudio()
    audio.play = vi.fn(async () => undefined)
    const player = new AlarmPlayback(audio as unknown as HTMLAudioElement)
    const pending = player.play(alarmFixture)
    await Promise.resolve()
    player.stop()
    await pending
    expect(audio.pause).toHaveBeenCalled()
    expect(audio.play).toHaveBeenCalledTimes(1)
  })
})

describe('saídas de áudio', () => {
  it('lista apenas dispositivos de saída com rótulos de fallback', async () => {
    const stop = vi.fn()
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: {
      getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [{ stop }] }),
      enumerateDevices: vi.fn().mockResolvedValue([
        { kind: 'audioinput', deviceId: 'mic', label: 'Microfone' },
        { kind: 'audiooutput', deviceId: 'default', label: '' },
        { kind: 'audiooutput', deviceId: 'fone', label: 'Headset USB' }
      ])
    } })
    await expect(getAudioOutputs(true)).resolves.toEqual([
      { deviceId: 'default', label: 'Saída padrão do sistema' },
      { deviceId: 'fone', label: 'Headset USB' }
    ])
    expect(stop).toHaveBeenCalled()
  })
})
