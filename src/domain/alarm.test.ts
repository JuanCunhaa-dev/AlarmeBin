import { describe, expect, it, vi } from 'vitest'
import { createAlarm, formatDays, isAlarmDue, occurrenceKey, playbackCount, sanitizeSyncKey, validateTime } from './alarm'
import { alarmFixture } from '../test/fixtures'

describe('regras do alarme', () => {
  it.each([
    [16, 2], [15, 2], [10, 3], [7, 5], [30, 1], [31, 1], [0, 1], [Number.NaN, 1]
  ])('toca ciclos inteiros de %ss até ultrapassar 30s', (duration, expected) => {
    expect(playbackCount(duration)).toBe(expected)
  })

  it.each(['00:00', '07:30', '23:59'])('aceita horário válido %s', (time) => expect(validateTime(time)).toBe(true))
  it.each(['24:00', '7:30', '12:60', '', 'agora'])('rejeita horário inválido %s', (time) => expect(validateTime(time)).toBe(false))

  it('dispara apenas no dia e minuto configurados, se ativo e fora da pausa', () => {
    const mondayAtTime = new Date(2026, 8, 28, 7, 30, 42)
    expect(isAlarmDue(alarmFixture, mondayAtTime, null)).toBe(true)
    expect(isAlarmDue({ ...alarmFixture, enabled: false }, mondayAtTime, null)).toBe(false)
    expect(isAlarmDue(alarmFixture, new Date(2026, 8, 28, 7, 31), null)).toBe(false)
    expect(isAlarmDue(alarmFixture, new Date(2026, 8, 27, 7, 30), null)).toBe(false)
    expect(isAlarmDue(alarmFixture, mondayAtTime, new Date(2026, 8, 28, 8).toISOString())).toBe(false)
  })

  it('gera uma chave única por ocorrência diária', () => {
    expect(occurrenceKey(alarmFixture, new Date(2026, 8, 28))).toBe('alarm-1:2026-09-28:07:30')
  })

  it('formata combinações de dias', () => {
    expect(formatDays([0, 1, 2, 3, 4, 5, 6])).toBe('Todos os dias')
    expect(formatDays([1, 2, 3, 4, 5])).toBe('Dias úteis')
    expect(formatDays([0, 6])).toBe('Fim de semana')
    expect(formatDays([1, 3])).toBe('Seg, Qua')
  })

  it('normaliza a chave compartilhada', () => expect(sanitizeSyncKey(' Meu Amor! 2026 ')).toBe('meu-amor-2026'))

  it('cria um alarme ativo com identificador e datas', () => {
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('00000000-0000-4000-8000-000000000999')
    const created = createAlarm({
      label: alarmFixture.label, time: alarmFixture.time, days: alarmFixture.days, audio: alarmFixture.audio,
      outputDeviceId: alarmFixture.outputDeviceId, outputDeviceLabel: alarmFixture.outputDeviceLabel
    })
    expect(created.id).toBe('00000000-0000-4000-8000-000000000999')
    expect(created.enabled).toBe(true)
    expect(created.createdAt).toBe(created.updatedAt)
  })
})
