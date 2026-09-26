export type RecordingMode = 'natural' | 'noise-reduction' | 'echo-control'

export const RECORDING_MODES: Array<{ value: RecordingMode; label: string; description: string }> = [
  {
    value: 'natural',
    label: 'Voz natural',
    description: 'Preserva o timbre sem filtros agressivos. Recomendado.'
  },
  {
    value: 'noise-reduction',
    label: 'Reduzir ruído',
    description: 'Remove ventilador e ruído constante, sem alterar o volume.'
  },
  {
    value: 'echo-control',
    label: 'Com caixas de som',
    description: 'Reduz eco quando há áudio tocando no ambiente.'
  }
]

export function recordingConstraints(mode: RecordingMode): MediaTrackConstraints {
  const base: MediaTrackConstraints = {
    channelCount: { ideal: 1 },
    sampleRate: { ideal: 48_000 },
    sampleSize: { ideal: 24 },
    autoGainControl: false
  }

  if (mode === 'noise-reduction') {
    return { ...base, echoCancellation: false, noiseSuppression: true }
  }

  if (mode === 'echo-control') {
    return { ...base, echoCancellation: true, noiseSuppression: true }
  }

  return { ...base, echoCancellation: false, noiseSuppression: false }
}
