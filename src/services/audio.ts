import type { Alarm, AudioOutput } from '../types'
import { playbackCount } from '../domain/alarm'

export async function getAudioOutputs(requestPermission = false): Promise<AudioOutput[]> {
  if (!navigator.mediaDevices?.enumerateDevices) return [{ deviceId: 'default', label: 'Saída padrão do sistema' }]
  if (requestPermission && navigator.mediaDevices.getUserMedia) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach((track) => track.stop())
    } catch {
      // A seleção ainda pode funcionar com os identificadores anônimos.
    }
  }
  const devices = await navigator.mediaDevices.enumerateDevices()
  const outputs = devices
    .filter((device) => device.kind === 'audiooutput')
    .map((device, index) => ({
      deviceId: device.deviceId,
      label: device.label || (device.deviceId === 'default' ? 'Saída padrão do sistema' : `Saída de áudio ${index + 1}`)
    }))
  return outputs.length ? outputs : [{ deviceId: 'default', label: 'Saída padrão do sistema' }]
}

export function dataUrlFromBlob(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error ?? new Error('Não foi possível ler o áudio.'))
    reader.readAsDataURL(blob)
  })
}

export function getAudioDuration(dataUrl: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = new Audio()
    audio.preload = 'metadata'
    audio.onloadedmetadata = () => resolve(audio.duration)
    audio.onerror = () => reject(new Error('Formato de áudio inválido ou corrompido.'))
    audio.src = dataUrl
  })
}

export class AlarmPlayback {
  private audio: HTMLAudioElement
  private stopped = false
  private resolveCurrent: (() => void) | null = null

  constructor(audio = new Audio()) {
    this.audio = audio
  }

  async play(alarm: Alarm, onProgress?: (current: number, total: number) => void) {
    this.stopped = false
    this.audio.src = alarm.audio.dataUrl
    this.audio.preload = 'auto'
    if (this.audio.setSinkId && alarm.outputDeviceId) await this.audio.setSinkId(alarm.outputDeviceId)
    const total = playbackCount(alarm.audio.durationSeconds)
    for (let current = 1; current <= total && !this.stopped; current += 1) {
      onProgress?.(current, total)
      this.audio.currentTime = 0
      await this.playOnce()
    }
  }

  stop() {
    this.stopped = true
    this.audio.pause()
    this.audio.currentTime = 0
    this.resolveCurrent?.()
    this.resolveCurrent = null
  }

  private playOnce() {
    return new Promise<void>((resolve, reject) => {
      const cleanup = () => {
        this.audio.removeEventListener('ended', ended)
        this.audio.removeEventListener('error', failed)
        this.resolveCurrent = null
      }
      const ended = () => { cleanup(); resolve() }
      const failed = () => { cleanup(); reject(new Error('Falha ao reproduzir o áudio.')) }
      this.audio.addEventListener('ended', ended, { once: true })
      this.audio.addEventListener('error', failed, { once: true })
      this.resolveCurrent = () => { cleanup(); resolve() }
      this.audio.play().catch((error) => { cleanup(); reject(error) })
    })
  }
}
