import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlarmClock, Cloud, MoonStar, Plus, Settings, TimerReset } from 'lucide-react'
import type { Alarm, AppSettings, PersistedState } from './types'
import { emptyState, isAlarmDue, occurrenceKey } from './domain/alarm'
import { loadState, saveState } from './services/persistence'
import { newestState, pullCloudState, pushCloudState } from './services/cloudSync'
import { AlarmPlayback } from './services/audio'
import { AlarmRow } from './components/AlarmRow'
import { AlarmEditor } from './components/AlarmEditor'
import { SettingsPanel } from './components/SettingsPanel'
import { RingingOverlay } from './components/RingingOverlay'
import './styles.css'

type Panel = { type: 'new' } | { type: 'edit'; id: string } | { type: 'settings' } | null

export default function App() {
  const [state, setState] = useState<PersistedState>(() => emptyState())
  const [loaded, setLoaded] = useState(false)
  const [panel, setPanel] = useState<Panel>(null)
  const [now, setNow] = useState(() => new Date())
  const [ringing, setRinging] = useState<Alarm | null>(null)
  const [loop, setLoop] = useState({ current: 0, total: 0 })
  const [syncStatus, setSyncStatus] = useState('')
  const firedRef = useRef(new Set<string>())
  const playerRef = useRef(new AlarmPlayback())
  const stateRef = useRef(state)

  useEffect(() => { stateRef.current = state }, [state])

  const updateState = useCallback((updater: (current: PersistedState) => PersistedState) => {
    setState((current) => {
      const next = updater(current)
      return { ...next, updatedAt: new Date().toISOString() }
    })
  }, [])

  useEffect(() => {
    void loadState().then(async (local) => {
      let resolved = local
      if (local.settings.sync.enabled) {
        try { resolved = newestState(local, await pullCloudState(local.settings.sync)) } catch { /* Continua com os dados locais. */ }
      }
      setState(resolved)
      setLoaded(true)
    })
  }, [])

  useEffect(() => {
    if (!loaded) return
    const timeout = window.setTimeout(() => {
      void saveState(state)
      if (state.settings.sync.enabled) void pushCloudState(state.settings.sync, state).catch(() => setSyncStatus('Não foi possível enviar as alterações.'))
    }, 250)
    return () => window.clearTimeout(timeout)
  }, [state, loaded])

  useEffect(() => {
    if (!loaded) return
    void window.alarmDesktop?.setStartup(state.settings.launchAtStartup)
  }, [loaded, state.settings.launchAtStartup])

  const finishAlarm = useCallback((alarm: Alarm) => {
    playerRef.current.stop()
    window.alarmDesktop?.alarmStopped()
    setRinging(null)
    updateState((current) => ({ ...current, alarms: current.alarms.map((item) => item.id === alarm.id ? { ...item, enabled: false, updatedAt: new Date().toISOString() } : item) }))
  }, [updateState])

  const startAlarm = useCallback(async (alarm: Alarm) => {
    if (ringing) return
    setRinging(alarm)
    window.alarmDesktop?.alarmStarted()
    try {
      await playerRef.current.play(alarm, (current, total) => setLoop({ current, total }))
    } catch (error) {
      setSyncStatus(error instanceof Error ? error.message : 'Falha ao tocar o alarme.')
    } finally {
      finishAlarm(alarm)
    }
  }, [finishAlarm, ringing])

  useEffect(() => {
    const check = () => {
      const current = new Date()
      setNow(current)
      for (const alarm of stateRef.current.alarms) {
        const key = occurrenceKey(alarm, current)
        if (isAlarmDue(alarm, current, stateRef.current.settings.quietUntil) && !firedRef.current.has(key)) {
          firedRef.current.add(key)
          void startAlarm(alarm)
          break
        }
      }
    }
    check()
    const timer = window.setInterval(check, 1000)
    return () => window.clearInterval(timer)
  }, [startAlarm])

  const saveAlarm = useCallback((alarm: Alarm) => {
    updateState((current) => {
      const exists = current.alarms.some((item) => item.id === alarm.id)
      return { ...current, alarms: exists ? current.alarms.map((item) => item.id === alarm.id ? alarm : item) : [...current.alarms, alarm] }
    })
    setPanel(null)
  }, [updateState])

  const deleteAlarm = useCallback((id: string) => {
    updateState((current) => ({ ...current, alarms: current.alarms.filter((alarm) => alarm.id !== id) }))
    setPanel(null)
  }, [updateState])

  const updateSettings = useCallback((settings: AppSettings) => updateState((current) => ({ ...current, settings })), [updateState])

  const syncNow = useCallback(async () => {
    const current = stateRef.current
    const cloud = await pullCloudState(current.settings.sync)
    const merged = newestState(current, cloud)
    if (merged === current) await pushCloudState(current.settings.sync, current)
    else setState(merged)
    setSyncStatus(`Sincronizado às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`)
  }, [])

  function quietFor(minutes: number) {
    if (ringing) finishAlarm(ringing)
    const quietUntil = new Date(now.getTime() + minutes * 60_000).toISOString()
    updateState((current) => ({ ...current, settings: { ...current.settings, quietUntil } }))
  }

  const activeCount = state.alarms.filter((alarm) => alarm.enabled).length
  const quietUntil = state.settings.quietUntil ? new Date(state.settings.quietUntil) : null
  const isQuiet = quietUntil ? quietUntil.getTime() > now.getTime() : false
  const editedAlarm = panel?.type === 'edit' ? state.alarms.find((alarm) => alarm.id === panel.id) ?? null : null
  const clock = useMemo(() => now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), [now])
  const date = useMemo(() => now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }), [now])

  if (!loaded) return <main className="loading"><AlarmClock size={42} /><span>Preparando seus alarmes…</span></main>

  return (
    <main className="app-shell">
      <div className="titlebar" />
      <section className="dashboard">
        <header className="topbar">
          <div className="brand"><AlarmClock size={22} /><span>ALARME<span>BIN</span></span></div>
          <div className="top-actions">
            {state.settings.sync.enabled && <span className="cloud-state"><Cloud size={14} /> Nuvem ativa</span>}
            <button className="icon-button" type="button" onClick={() => setPanel({ type: 'settings' })} aria-label="Abrir configurações"><Settings size={19} /></button>
          </div>
        </header>

        <section className="clock-stage">
          <span>{date}</span>
          <time>{clock}</time>
          <div className="clock-status"><i className={activeCount ? 'online' : ''} /> {activeCount ? `${activeCount} ${activeCount === 1 ? 'alarme ativo' : 'alarmes ativos'}` : 'Nenhum alarme ativo'}</div>
        </section>

        <section className="alarm-list-section">
          <div className="section-heading">
            <div><span>MEUS HORÁRIOS</span><h1>Alarmes</h1></div>
            <button className="button add-button" type="button" onClick={() => setPanel({ type: 'new' })}><Plus size={19} /> Novo alarme</button>
          </div>

          {isQuiet && <div className="quiet-banner"><MoonStar size={17} /><span>Pausados até {quietUntil?.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span><button type="button" onClick={() => updateState((current) => ({ ...current, settings: { ...current.settings, quietUntil: null } }))}>Retomar agora</button></div>}

          <div className="alarm-list">
            {state.alarms.length ? state.alarms.slice().sort((a, b) => a.time.localeCompare(b.time)).map((alarm) => (
              <AlarmRow
                key={alarm.id}
                alarm={alarm}
                onEdit={() => setPanel({ type: 'edit', id: alarm.id })}
                onToggle={(enabled) => updateState((current) => ({ ...current, alarms: current.alarms.map((item) => item.id === alarm.id ? { ...item, enabled, updatedAt: new Date().toISOString() } : item) }))}
              />
            )) : (
              <div className="empty-state"><TimerReset size={38} /><h2>Seu primeiro alarme começa aqui</h2><p>Grave uma voz especial, escolha a caixa de som e deixe o resto com a gente.</p><button className="text-button" type="button" onClick={() => setPanel({ type: 'new' })}>Criar alarme</button></div>
            )}
          </div>
        </section>

        <footer className="global-quiet">
          <span>Pausar todos temporariamente</span>
          {[5, 10, 15, 30, 60].map((minutes) => <button key={minutes} type="button" onClick={() => quietFor(minutes)}>{minutes === 60 ? '1h' : `${minutes}min`}</button>)}
        </footer>
      </section>

      {panel?.type === 'settings' && <SettingsPanel settings={state.settings} syncStatus={syncStatus} onChange={updateSettings} onSync={syncNow} onClose={() => setPanel(null)} />}
      {(panel?.type === 'new' || panel?.type === 'edit') && <AlarmEditor key={panel.type === 'edit' ? panel.id : 'new'} alarm={editedAlarm} onSave={saveAlarm} onDelete={deleteAlarm} onClose={() => setPanel(null)} />}
      {panel && <button className="scrim" type="button" aria-label="Fechar painel" onClick={() => setPanel(null)} />}
      {ringing && <RingingOverlay alarm={ringing} currentLoop={loop.current} totalLoops={loop.total} onClose={() => finishAlarm(ringing)} onQuiet={quietFor} />}
    </main>
  )
}
