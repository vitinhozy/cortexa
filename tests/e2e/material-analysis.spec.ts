import { test, expect } from '@playwright/test';
import { ensurePersonalWorkspace } from './workspace-helpers';

test('a personal note opens concept analysis without pretending there is a configured provider', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await ensurePersonalWorkspace(page);
  await page.goto('/material/add');
  await page.getByRole('button', { name: 'Anatomia', exact: true }).click();
  await page.getByRole('textbox', { name: 'Título', exact: true }).fill('Minha anotação');
  await page
    .getByRole('textbox', { name: 'Anotação', exact: true })
    .fill('Texto pessoal de estudo, sem dados de pacientes.');
  await page.getByRole('button', { name: 'Salvar anotação', exact: true }).click();
  await page.getByRole('button', { name: 'Analisar conceitos', exact: true }).click();
  const popup = page.getByRole('dialog', { name: 'Conceitos do material', exact: true });
  await expect(popup).toBeVisible();
  await expect(popup.getByText(/Entre na sua conta para analisar seus materiais/)).toBeVisible();
  await expect(popup.getByRole('button', { name: 'Analisar esta anotação' })).toHaveCount(0);
  await popup.getByRole('button', { name: 'Entrar ou criar conta', exact: true }).click();
  await expect(page).toHaveURL(/\/account\?.*next=/);
  await expect(page.getByRole('textbox', { name: 'E-mail', exact: true })).toBeVisible();
  await page.goBack();
  await expect(popup).toBeVisible();
  await popup.getByRole('button', { name: 'Fechar', exact: true }).click();
  await expect(popup).toHaveCount(0);
  await expect(page).toHaveURL(/\/material\/note-/);
  await page.reload();
  await expect(
    page.getByText('Texto pessoal de estudo, sem dados de pacientes.', { exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
