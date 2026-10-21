import { expect, test } from '@playwright/test';
import { ensurePersonalWorkspace } from './workspace-helpers';

test('sem credenciais mantém estudo local e informa autenticação indisponível', async ({
  page,
}) => {
  const externalRequests: string[] = [];
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (url.protocol.startsWith('http') && !['localhost', '127.0.0.1'].includes(url.hostname)) {
      externalRequests.push(url.origin);
      await route.abort();
    } else await route.continue();
  });
  await ensurePersonalWorkspace(page);
  await page.goto('/material/add');
  await page.getByRole('button', { name: 'Anatomia', exact: true }).click();
  await page.getByRole('textbox', { name: 'Título', exact: true }).fill('Estudo sem conta');
  await page.getByRole('textbox', { name: 'Anotação', exact: true }).fill('Texto local de teste.');
  await page.getByRole('button', { name: 'Salvar anotação', exact: true }).click();
  await page.reload();
  await expect(page.getByText('Texto local de teste.', { exact: true })).toBeVisible();
  await page.goto('/account');
  await expect(page.getByText('Acesso por conta indisponível', { exact: true })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'E-mail', exact: true })).toHaveCount(0);
  expect(externalRequests).toEqual([]);
});
