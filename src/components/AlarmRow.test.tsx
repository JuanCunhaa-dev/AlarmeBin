import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AlarmRow } from './AlarmRow'
import { alarmFixture } from '../test/fixtures'

describe('AlarmRow', () => {
  it('mostra os detalhes e permite editar e desativar', async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()
    const onToggle = vi.fn()
    render(<AlarmRow alarm={alarmFixture} onEdit={onEdit} onToggle={onToggle} />)
    expect(screen.getByText('07:30')).toBeInTheDocument()
    expect(screen.getByText('Voz da manhã')).toBeInTheDocument()
    expect(screen.getByText(/Dias úteis/)).toBeInTheDocument()
    await user.click(screen.getByRole('switch', { name: 'Desativar Voz da manhã' }))
    expect(onToggle).toHaveBeenCalledWith(false)
    await user.click(screen.getByRole('button', { name: 'Editar Voz da manhã' }))
    expect(onEdit).toHaveBeenCalled()
  })
})
