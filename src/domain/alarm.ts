import type { Alarm, AppSettings, PersistedState } from '../types'

export const WEEK_DAYS = [
  { value: 0, short: 'D', label: 'Domingo' },
  { value: 1, short: 'S', label: 'Segunda-feira' },
  { value: 2, short: 'T', label: 'Terça-feira' },
  { value: 3, short: 'Q', label: 'Quarta-feira' },
  { value: 4, short: 'Q', label: 'Quinta-feira' },
  { value: 5, short: 'S', label: 'Sexta-feira' },
  { value: 6, short: 'S', label: 'Sábado' }
] as const

export const defaultSettings: AppSettings = {
  quietUntil: null,
  launchAtStartup: true,
  sync: { enabled: false, databaseUrl: '', syncKey: 'alarme-casal' }
}

export const emptyState = (): PersistedState => ({
  version: 1,
  alarms: [],
  settings: structuredClone(defaultSettings),
  updatedAt: new Date().toISOString()
})

export function createAlarm(partial: Pick<Alarm, 'label' | 'time' | 'days' | 'audio' | 'outputDeviceId' | 'outputDeviceLabel'>): Alarm {
  const now = new Date().toISOString()
  return {
    ...partial,
    id: crypto.randomUUID(),
    enabled: true,
    createdAt: now,
    updatedAt: now
  }
}

export function validateTime(time: string) {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return false
  return true
}

export function isAlarmDue(alarm: Alarm, now: Date, quietUntil: string | null) {
  if (!alarm.enabled || !validateTime(alarm.time)) return false
  if (quietUntil && new Date(quietUntil).getTime() > now.getTime()) return false
  if (!alarm.days.includes(now.getDay())) return false
  const [hours, minutes] = alarm.time.split(':').map(Number)
  return now.getHours() === hours && now.getMinutes() === minutes
}

export function occurrenceKey(alarm: Alarm, now: Date) {
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${alarm.id}:${year}-${month}-${day}:${alarm.time}`
}

export function playbackCount(durationSeconds: number, minimumSeconds = 30) {
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) return 1
  return Math.max(1, Math.ceil(minimumSeconds / durationSeconds))
}

export function formatDays(days: number[]) {
  const sorted = [...new Set(days)].sort()
  if (sorted.length === 7) return 'Todos os dias'
  if (sorted.length === 5 && sorted.every((day, index) => day === index + 1)) return 'Dias úteis'
  if (sorted.length === 2 && sorted[0] === 0 && sorted[1] === 6) return 'Fim de semana'
  return WEEK_DAYS.filter((day) => sorted.includes(day.value)).map((day) => day.label.slice(0, 3)).join(', ')
}

export function sanitizeSyncKey(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 60)
}
