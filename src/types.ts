export type AlarmAudio = {
  name: string
  mimeType: string
  dataUrl: string
  durationSeconds: number
}

export type Alarm = {
  id: string
  label: string
  time: string
  days: number[]
  enabled: boolean
  audio: AlarmAudio
  outputDeviceId: string
  outputDeviceLabel: string
  createdAt: string
  updatedAt: string
}

export type SyncSettings = {
  enabled: boolean
  databaseUrl: string
  syncKey: string
}

export type AppSettings = {
  quietUntil: string | null
  launchAtStartup: boolean
  sync: SyncSettings
}

export type PersistedState = {
  version: 1
  alarms: Alarm[]
  settings: AppSettings
  updatedAt: string
}

export type AudioOutput = {
  deviceId: string
  label: string
}

declare global {
  interface Window {
    alarmDesktop?: {
      readStore: (name: string) => Promise<unknown>
      writeStore: (name: string, value: unknown) => Promise<void>
      setStartup: (enabled: boolean) => Promise<boolean>
      getStartup: () => Promise<boolean>
      alarmStarted: () => void
      alarmStopped: () => void
      platform: string
    }
  }

}
