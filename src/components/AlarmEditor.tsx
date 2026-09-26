import { ChevronLeft, Headphones, Save, Trash2, Volume2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { WEEK_DAYS, createAlarm, validateTime } from '../domain/alarm'
import { getAudioOutputs } from '../services/audio'
import type { Alarm, AlarmAudio, AudioOutput } from '../types'
import { Recorder } from './Recorder'

type AlarmEditorProps = {
  alarm: Alarm | null
  onSave: (alarm: Alarm) => void
  onDelete: (id: string) => void
  onClose: () => void
}

type FormState = {
  label: string
  time: string
  days: number[]
  audio: AlarmAudio | null
  outputDeviceId: string
  outputDeviceLabel: string
}

function initialForm(alarm: Alarm | null): FormState {
  return alarm ? {
    label: alarm.label,
    time: alarm.time,
    days: alarm.days,
    audio: alarm.audio,
    outputDeviceId: alarm.outputDeviceId,
    outputDeviceLabel: alarm.outputDeviceLabel
  } : {
    label: 'Bom dia, meu amor',
    time: '07:30',
    days: [1, 2, 3, 4, 5],
    audio: null,
    outputDeviceId: 'default',
    outputDeviceLabel: 'Saída padrão do sistema'
  }
}

export function AlarmEditor({ alarm, onSave, onDelete, onClose }: AlarmEditorProps) {
  const [form, setForm] = useState(() => initialForm(alarm))
  const [outputs, setOutputs] = useState<AudioOutput[]>([{ deviceId: 'default', label: 'Saída padrão do sistema' }])
  const [errors, setErrors] = useState<string[]>([])

  useEffect(() => {
    void getAudioOutputs(true).then((devices) => {
      if (form.outputDeviceId && !devices.some((device) => device.deviceId === form.outputDeviceId)) {
        setOutputs([{ deviceId: form.outputDeviceId, label: form.outputDeviceLabel }, ...devices])
      } else setOutputs(devices)
    })
    // O formulário é remontado ao trocar de alarme; consultamos os dispositivos uma única vez.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function toggleDay(day: number) {
    setForm((current) => ({
      ...current,
      days: current.days.includes(day) ? current.days.filter((value) => value !== day) : [...current.days, day].sort()
    }))
  }

  async function testOutput() {
    const context = new AudioContext()
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    gain.gain.setValueAtTime(0.12, context.currentTime)
    oscillator.frequency.value = 660
    oscillator.connect(gain)
    const destination = context.createMediaStreamDestination()
    gain.connect(destination)
    const audio = new Audio()
    audio.srcObject = destination.stream
    if (audio.setSinkId) await audio.setSinkId(form.outputDeviceId)
    await audio.play()
    oscillator.start()
    oscillator.stop(context.currentTime + 0.35)
    window.setTimeout(() => { audio.pause(); void context.close() }, 450)
  }

  function submit() {
    const nextErrors: string[] = []
    if (!form.label.trim()) nextErrors.push('Dê um nome ao alarme.')
    if (!validateTime(form.time)) nextErrors.push('Informe um horário válido.')
    if (!form.days.length) nextErrors.push('Escolha pelo menos um dia.')
    if (!form.audio) nextErrors.push('Grave uma mensagem de voz.')
    setErrors(nextErrors)
    if (nextErrors.length || !form.audio) return
    if (alarm) {
      onSave({ ...alarm, ...form, label: form.label.trim(), audio: form.audio, updatedAt: new Date().toISOString() })
    } else {
      onSave(createAlarm({ ...form, label: form.label.trim(), audio: form.audio }))
    }
  }

  return (
    <aside className="editor" aria-label={alarm ? 'Editar alarme' : 'Novo alarme'}>
      <header className="editor-header">
        <button className="icon-button" type="button" onClick={onClose} aria-label="Voltar"><ChevronLeft /></button>
        <div><span>{alarm ? 'AJUSTAR' : 'CRIAR'}</span><h2>{alarm ? 'Editar alarme' : 'Novo alarme'}</h2></div>
      </header>

      <div className="editor-scroll">
        <label className="field time-field">
          <span>Horário</span>
          <input type="time" value={form.time} onChange={(event) => setForm({ ...form, time: event.target.value })} aria-label="Horário" />
        </label>

        <label className="field">
          <span>Nome do alarme</span>
          <input value={form.label} maxLength={48} onChange={(event) => setForm({ ...form, label: event.target.value })} placeholder="Ex.: Acordar com amor" />
        </label>

        <fieldset className="day-picker">
          <legend>Repetir</legend>
          <div>{WEEK_DAYS.map((day) => (
            <button key={day.value} type="button" className={form.days.includes(day.value) ? 'selected' : ''} onClick={() => toggleDay(day.value)} aria-pressed={form.days.includes(day.value)} title={day.label}>{day.short}</button>
          ))}</div>
        </fieldset>

        <section className="editor-section">
          <h3><Volume2 size={17} /> Áudio do alarme</h3>
          <Recorder value={form.audio} onChange={(audio) => setForm((current) => ({ ...current, audio }))} />
        </section>

        <section className="editor-section">
          <h3><Headphones size={17} /> Onde vai tocar</h3>
          <div className="output-row">
            <select
              value={form.outputDeviceId}
              aria-label="Saída de áudio"
              onChange={(event) => {
                const output = outputs.find((item) => item.deviceId === event.target.value)
                setForm({ ...form, outputDeviceId: event.target.value, outputDeviceLabel: output?.label ?? 'Saída selecionada' })
              }}
            >
              {outputs.map((output) => <option key={output.deviceId} value={output.deviceId}>{output.label}</option>)}
            </select>
            <button type="button" className="text-button" onClick={() => void testOutput()}>Testar</button>
          </div>
          <small>A escolha fica salva apenas para este alarme.</small>
        </section>

        {errors.length > 0 && <div className="error-summary" role="alert">{errors.map((error) => <span key={error}>{error}</span>)}</div>}
      </div>

      <footer className="editor-actions">
        {alarm && <button className="button danger" type="button" onClick={() => onDelete(alarm.id)}><Trash2 size={17} /> Remover</button>}
        <button className="button primary" type="button" onClick={submit}><Save size={17} /> Salvar alarme</button>
      </footer>
    </aside>
  )
}
