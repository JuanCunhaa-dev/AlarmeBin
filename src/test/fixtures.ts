import type { Alarm, PersistedState } from '../types'
import { defaultSettings } from '../domain/alarm'

export const alarmFixture: Alarm = {
  id: 'alarm-1',
  label: 'Voz da manhã',
  time: '07:30',
  days: [1, 2, 3, 4, 5],
  enabled: true,
  audio: { name: 'amor.webm', mimeType: 'audio/webm', dataUrl: 'data:audio/webm;base64,AAAA', durationSeconds: 16 },
  outputDeviceId: 'speakers-1',
  outputDeviceLabel: 'Caixas de som',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z'
}

export const stateFixture: PersistedState = {
  version: 1,
  alarms: [alarmFixture],
  settings: structuredClone(defaultSettings),
  updatedAt: '2026-01-01T00:00:00.000Z'
}
