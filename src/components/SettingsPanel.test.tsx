import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SettingsPanel } from './SettingsPanel'
import { defaultSettings } from '../domain/alarm'

describe('SettingsPanel', () => {
  it('altera inicialização, configura nuvem e sincroniza', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const onSync = vi.fn().mockResolvedValue(undefined)
    const settings = { ...structuredClone(defaultSettings), sync: { enabled: true, databaseUrl: '', syncKey: 'alarme-casal' } }
    render(<SettingsPanel settings={settings} syncStatus="" onChange={onChange} onSync={onSync} onClose={vi.fn()} />)
    await user.click(screen.getByRole('switch', { name: 'Iniciar com o Windows' }))
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ launchAtStartup: false }))
    await user.click(screen.getByRole('button', { name: /Sincronizar agora/ }))
    expect(onSync).toHaveBeenCalled()
  })
})
