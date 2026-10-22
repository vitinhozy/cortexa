import { expect, test } from '@playwright/test';
import { createSimulatedAuthSession } from '../../mocks/auth';
import { createSeed } from '../../mocks/seed';
import { authStorageKey } from './fixtures';

test('sem credenciais abre experiência pública, preserva dados e informa acesso indisponível', async ({
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
  await page.goto('/');
  await expect(page).toHaveURL('http://localhost:8081/');
  await expect(page.getByRole('heading', { name: /Aprenda Medicina/ })).toBeVisible();
  const snapshot = JSON.stringify(createSeed());
  await page.evaluate((value) => {
    localStorage.setItem('cortexa:demo:v1', value);
    localStorage.setItem('cortexa:workspace', 'demo');
  }, snapshot);
  await page.getByRole('button', { name: 'Começar no Cortexa', exact: true }).click();
  await expect(page).toHaveURL(/\/account(?:\?|$)/);
  await expect(page.getByText('Acesso por conta indisponível', { exact: true })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'E-mail', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Continuar sem conta', exact: true })).toHaveCount(
    0,
  );
  for (const path of ['/onboarding', '/material/add', '/library', '/questions', '/ai']) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/account\?.*next=/);
    await expect(page.getByText('Acesso por conta indisponível', { exact: true })).toBeVisible();
    await expect(page.getByRole('tab')).toHaveCount(0);
    await expect(page.getByRole('textbox', { name: 'Anotação', exact: true })).toHaveCount(0);
  }
  expect(await page.evaluate(() => localStorage.getItem('cortexa:demo:v1'))).toBe(snapshot);
  expect(externalRequests).toEqual([]);
});

test('sem configuração nem sessão salva anteriormente libera rota privada', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(({ key, value }) => localStorage.setItem(key, value), {
    key: authStorageKey,
    value: JSON.stringify(createSimulatedAuthSession()),
  });
  await page.goto('/overview');
  await expect(page).toHaveURL(/\/account\?.*next=/);
  await expect(page.getByText('Acesso por conta indisponível', { exact: true })).toBeVisible();
  await expect(page.getByTestId('study-calendar')).toHaveCount(0);
});
