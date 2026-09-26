import { expect, test } from '@playwright/test'

test('cria a intenção de alarme, valida áudio e permite pausa temporária', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Seu primeiro alarme começa aqui')).toBeVisible()
  await page.getByRole('button', { name: /Novo alarme/ }).click()
  await expect(page.getByRole('complementary', { name: 'Novo alarme' })).toBeVisible()
  await page.getByRole('button', { name: /Salvar alarme/ }).click()
  await expect(page.getByRole('alert')).toContainText('Grave uma mensagem de voz.')
  await page.getByRole('button', { name: 'Voltar' }).click()
  await page.getByRole('button', { name: '15min' }).click()
  await expect(page.getByText(/Pausados até/)).toBeVisible()
  await page.getByRole('button', { name: 'Retomar agora' }).click()
  await expect(page.getByText(/Pausados até/)).not.toBeVisible()
})
