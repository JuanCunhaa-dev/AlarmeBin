import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AlarmEditor } from './AlarmEditor'
import { alarmFixture } from '../test/fixtures'

describe('AlarmEditor', () => {
  it('valida todos os campos obrigatórios de um novo alarme', async () => {
    const user = userEvent.setup()
    render(<AlarmEditor alarm={null} onSave={vi.fn()} onDelete={vi.fn()} onClose={vi.fn()} />)
    await user.clear(screen.getByPlaceholderText('Ex.: Acordar com amor'))
    for (const button of screen.getAllByRole('button', { pressed: true })) await user.click(button)
    await user.click(screen.getByRole('button', { name: /Salvar alarme/ }))
    expect(screen.getByRole('alert')).toHaveTextContent('Dê um nome ao alarme.')
    expect(screen.getByRole('alert')).toHaveTextContent('Escolha pelo menos um dia.')
    expect(screen.getByRole('alert')).toHaveTextContent('Grave uma mensagem de voz.')
  })

  it('edita e remove um alarme existente', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    const onDelete = vi.fn()
    render(<AlarmEditor alarm={alarmFixture} onSave={onSave} onDelete={onDelete} onClose={vi.fn()} />)
    await waitFor(() => expect(screen.getByLabelText('Saída de áudio')).toBeInTheDocument())
    const input = screen.getByDisplayValue('Voz da manhã')
    await user.clear(input)
    await user.type(input, 'Mensagem da noite')
    await user.click(screen.getByRole('button', { name: /Salvar alarme/ }))
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ id: 'alarm-1', label: 'Mensagem da noite' }))
    await user.click(screen.getByRole('button', { name: /Remover/ }))
    expect(onDelete).toHaveBeenCalledWith('alarm-1')
  })
})
