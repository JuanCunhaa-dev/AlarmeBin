import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'
import { stateFixture } from './test/fixtures'

describe('aplicativo', () => {
  it('carrega, alterna, edita e remove um alarme persistido', async () => {
    localStorage.setItem('alarmebin-state-v1', JSON.stringify(stateFixture))
    const user = userEvent.setup()
    render(<App />)
    expect(await screen.findByText('Voz da manhã')).toBeInTheDocument()
    await user.click(screen.getByRole('switch', { name: 'Desativar Voz da manhã' }))
    expect(screen.getByRole('switch', { name: 'Ativar Voz da manhã' })).toHaveAttribute('aria-checked', 'false')

    await user.click(screen.getByRole('button', { name: 'Editar Voz da manhã' }))
    const input = screen.getByDisplayValue('Voz da manhã')
    await user.clear(input)
    await user.type(input, 'Acordar juntos')
    await user.click(screen.getByRole('button', { name: /Salvar alarme/ }))
    expect(await screen.findByText('Acordar juntos')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Editar Acordar juntos' }))
    await user.click(screen.getByRole('button', { name: /Remover/ }))
    await waitFor(() => expect(screen.queryByText('Acordar juntos')).not.toBeInTheDocument())
    expect(screen.getByText('Seu primeiro alarme começa aqui')).toBeInTheDocument()
  })

  it('abre o criador e mostra validações', async () => {
    const user = userEvent.setup()
    render(<App />)
    await screen.findByText('Seu primeiro alarme começa aqui')
    await user.click(screen.getByRole('button', { name: /Novo alarme/ }))
    expect(screen.getByRole('complementary', { name: 'Novo alarme' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Salvar alarme/ }))
    expect(screen.getByRole('alert')).toHaveTextContent('Grave uma mensagem de voz.')
  })
})
