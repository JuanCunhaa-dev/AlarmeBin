import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { RingingOverlay } from './RingingOverlay'
import { alarmFixture } from '../test/fixtures'

describe('RingingOverlay', () => {
  it('fecha o alarme e oferece pausa global, sem soneca', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const onQuiet = vi.fn()
    render(<RingingOverlay alarm={alarmFixture} currentLoop={1} totalLoops={2} onClose={onClose} onQuiet={onQuiet} />)
    expect(screen.getByText('Voz da manhã')).toBeInTheDocument()
    expect(screen.queryByText(/soneca/i)).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Fechar alarme/ }))
    expect(onClose).toHaveBeenCalled()
    await user.selectOptions(screen.getByLabelText('Pausar todos os alarmes'), '15')
    expect(onQuiet).toHaveBeenCalledWith(15)
  })
})
