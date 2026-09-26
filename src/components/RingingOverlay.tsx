import { BellRing, Headphones, X } from 'lucide-react'
import type { Alarm } from '../types'

type RingingOverlayProps = {
  alarm: Alarm
  currentLoop: number
  totalLoops: number
  onClose: () => void
  onQuiet: (minutes: number) => void
}

export function RingingOverlay({ alarm, currentLoop, totalLoops, onClose, onQuiet }: RingingOverlayProps) {
  return (
    <div className="ringing-overlay" role="dialog" aria-modal="true" aria-label="Alarme tocando">
      <div className="ring-glow" />
      <BellRing className="ringing-bell" size={52} />
      <span className="ringing-kicker">ALARME TOCANDO</span>
      <div className="ringing-time">{alarm.time}</div>
      <h2>{alarm.label}</h2>
      <p><Headphones size={16} /> {alarm.outputDeviceLabel}</p>
      <div className="loop-progress" aria-label={`Reprodução ${currentLoop} de ${totalLoops}`}>
        {Array.from({ length: totalLoops }, (_, index) => <i key={index} className={index < currentLoop ? 'active' : ''} />)}
      </div>
      <button className="button close-alarm" type="button" onClick={onClose}><X size={20} /> Fechar alarme</button>
      <label className="quiet-inline">
        <span>Depois, pausar todos por</span>
        <select defaultValue="" onChange={(event) => event.target.value && onQuiet(Number(event.target.value))} aria-label="Pausar todos os alarmes">
          <option value="" disabled>Selecionar tempo</option>
          <option value="5">5 minutos</option>
          <option value="10">10 minutos</option>
          <option value="15">15 minutos</option>
          <option value="30">30 minutos</option>
          <option value="60">1 hora</option>
        </select>
      </label>
    </div>
  )
}
