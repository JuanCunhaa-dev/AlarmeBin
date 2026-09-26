import { describe, expect, it } from 'vitest'
import { recordingConstraints } from './recording'

describe('modos de gravação', () => {
  it('preserva a voz no modo natural', () => {
    expect(recordingConstraints('natural')).toMatchObject({
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
      channelCount: { ideal: 1 },
      sampleRate: { ideal: 48_000 }
    })
  })

  it('reduz apenas ruído constante sem ganho automático', () => {
    expect(recordingConstraints('noise-reduction')).toMatchObject({
      echoCancellation: false,
      noiseSuppression: true,
      autoGainControl: false
    })
  })

  it('só ativa cancelamento de eco no modo apropriado', () => {
    expect(recordingConstraints('echo-control')).toMatchObject({
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: false
    })
  })
})
