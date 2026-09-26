import { ChevronLeft, Cloud, ExternalLink, MonitorUp } from 'lucide-react'
import { useState } from 'react'
import type { AppSettings } from '../types'
import { Toggle } from './Toggle'

type SettingsPanelProps = {
  settings: AppSettings
  syncStatus: string
  onChange: (settings: AppSettings) => void
  onSync: () => Promise<void>
  onClose: () => void
}

export function SettingsPanel({ settings, syncStatus, onChange, onSync, onClose }: SettingsPanelProps) {
  const [syncError, setSyncError] = useState('')

  async function syncNow() {
    setSyncError('')
    try { await onSync() } catch (error) { setSyncError(error instanceof Error ? error.message : 'Falha ao sincronizar.') }
  }

  return (
    <aside className="editor settings-panel" aria-label="Configurações">
      <header className="editor-header">
        <button className="icon-button" type="button" onClick={onClose} aria-label="Voltar"><ChevronLeft /></button>
        <div><span>ALARME BIN</span><h2>Configurações</h2></div>
      </header>
      <div className="editor-scroll">
        <section className="setting-row">
          <div><h3><MonitorUp size={17} /> Iniciar com o Windows</h3><p>Mantém os alarmes funcionando mesmo sem abrir o app.</p></div>
          <Toggle checked={settings.launchAtStartup} label="Iniciar com o Windows" onChange={(launchAtStartup) => onChange({ ...settings, launchAtStartup })} />
        </section>

        <section className="sync-section">
          <h3><Cloud size={17} /> Sincronização entre PCs</h3>
          <p>Use um Firebase Realtime Database para compartilhar os mesmos alarmes. O áudio gravado também é enviado.</p>
          <label className="field">
            <span>URL do banco</span>
            <input value={settings.sync.databaseUrl} onChange={(event) => onChange({ ...settings, sync: { ...settings.sync, databaseUrl: event.target.value } })} placeholder="https://seu-projeto-default-rtdb.firebaseio.com" />
          </label>
          <label className="field">
            <span>Chave compartilhada</span>
            <input value={settings.sync.syncKey} onChange={(event) => onChange({ ...settings, sync: { ...settings.sync, syncKey: event.target.value } })} placeholder="alarme-casal" />
          </label>
          <div className="sync-controls">
            <div><span>Ativar sincronização</span><small>Qualquer PC com estes dados verá os alarmes.</small></div>
            <Toggle checked={settings.sync.enabled} label="Ativar sincronização" onChange={(enabled) => onChange({ ...settings, sync: { ...settings.sync, enabled } })} />
          </div>
          <button className="button secondary full" type="button" disabled={!settings.sync.enabled} onClick={() => void syncNow()}><Cloud size={17} /> Sincronizar agora</button>
          {syncStatus && <p className="sync-status">{syncStatus}</p>}
          {syncError && <p className="field-error" role="alert">{syncError}</p>}
          <a className="firebase-link" href="https://console.firebase.google.com/" target="_blank" rel="noreferrer">Abrir console do Firebase <ExternalLink size={14} /></a>
          <p className="security-note">Sem autenticação, qualquer pessoa que conheça a URL e a chave poderá alterar os alarmes. Use uma chave longa e não compartilhe esses dados.</p>
        </section>
      </div>
    </aside>
  )
}
