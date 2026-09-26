import { Edit3, Headphones } from 'lucide-react'
import type { Alarm } from '../types'
import { formatDays } from '../domain/alarm'
import { Toggle } from './Toggle'

type AlarmRowProps = {
  alarm: Alarm
  onToggle: (enabled: boolean) => void
  onEdit: () => void
}

export function AlarmRow({ alarm, onToggle, onEdit }: AlarmRowProps) {
  return (
    <article className={`alarm-row ${alarm.enabled ? '' : 'disabled'}`}>
      <button className="alarm-main" type="button" onClick={onEdit} aria-label={`Abrir ${alarm.label}`}>
        <time>{alarm.time}</time>
        <span className="alarm-copy"><strong>{alarm.label}</strong><small>{formatDays(alarm.days)} · <Headphones size={12} /> {alarm.outputDeviceLabel}</small></span>
      </button>
      <button className="icon-button edit-button" type="button" onClick={onEdit} aria-label={`Editar ${alarm.label}`}><Edit3 size={17} /></button>
      <Toggle checked={alarm.enabled} onChange={onToggle} label={`${alarm.enabled ? 'Desativar' : 'Ativar'} ${alarm.label}`} />
    </article>
  )
}
