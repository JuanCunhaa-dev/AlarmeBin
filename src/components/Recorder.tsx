import { Mic, Square, RotateCcw, SlidersHorizontal } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { AlarmAudio } from '../types'
import { useRecorder } from '../hooks/useRecorder'
import { RECORDING_MODES, type RecordingMode } from '../domain/recording'

type RecorderProps = {
  value: AlarmAudio | null
  onChange: (audio: AlarmAudio | null) => void
}

export function Recorder({ value, onChange }: RecorderProps) {
  const recorder = useRecorder()
  const [mode, setMode] = useState<RecordingMode>('natural')
  const selected = recorder.audio ?? value

  useEffect(() => {
    if (recorder.audio && recorder.audio !== value) onChange(recorder.audio)
  }, [onChange, recorder.audio, value])

  function reset() {
    recorder.reset()
    onChange(null)
  }

  if (recorder.status === 'recording') {
    return (
      <div className="recorder recording" aria-live="polite">
        <div className="recording-line">
          <span className="record-dot" />
          <strong>Gravando</strong>
          <span className="record-time">{recorder.elapsed.toFixed(1)}s</span>
          <div className="wave" aria-hidden="true">{Array.from({ length: 18 }, (_, index) => <i key={index} />)}</div>
        </div>
        <button className="button stop-button" type="button" onClick={recorder.stop}><Square size={16} fill="currentColor" /> Parar gravação</button>
      </div>
    )
  }

  if (recorder.status === 'processing') return <div className="recorder processing">Tratando o áudio…</div>

  if (selected) {
    return (
      <div className="audio-preview">
        <audio src={selected.dataUrl} controls aria-label="Prévia da gravação" />
        <div>
          <strong>{selected.name}</strong>
          <span>{selected.durationSeconds.toFixed(1)}s · tocará até completar pelo menos 30s</span>
        </div>
        <button className="icon-button" type="button" onClick={reset} aria-label="Gravar novamente"><RotateCcw size={18} /></button>
      </div>
    )
  }

  return (
    <div className="recorder">
      <div className="recorder-intro">
        <strong>Sua mensagem de voz</strong>
        <span><SlidersHorizontal size={14} /> Escolha o tratamento antes de gravar</span>
      </div>
      <div className="recording-modes" role="radiogroup" aria-label="Tratamento da gravação">
        {RECORDING_MODES.map((item) => (
          <button
            key={item.value}
            className={mode === item.value ? 'selected' : ''}
            type="button"
            role="radio"
            aria-checked={mode === item.value}
            title={item.description}
            onClick={() => setMode(item.value)}
          >
            <strong>{item.label}</strong>
            <small>{item.description}</small>
          </button>
        ))}
      </div>
      <button className="button secondary record-button" type="button" onClick={() => void recorder.start(mode)}><Mic size={18} /> Gravar agora</button>
      {recorder.error && <p className="field-error" role="alert">{recorder.error}</p>}
    </div>
  )
}
