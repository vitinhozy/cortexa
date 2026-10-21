import { expect, type Page } from '@playwright/test';

// Estado inicial explícito dos testes que exercitam conteúdo SIMULADO.
export const demonstrationStorage = {
  cookies: [],
  origins: [
    {
      origin: 'http://localhost:8081',
      localStorage: [{ name: 'cortexa:workspace', value: 'demo' }],
    },
  ],
};

export async function ensurePersonalWorkspace(page: Page) {
  await page.goto('/profile');
  const openPersonal = page.getByRole('button', { name: /Abrir meu espa/ });
  const personalBadge = page.getByText(/DADOS LOCAIS/);
  await expect
    .poll(async () => (await openPersonal.count()) + (await personalBadge.count()))
    .toBeGreaterThan(0);
  if (await openPersonal.count()) {
    await openPersonal.click();
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('cortexa:workspace')))
      .toBe('personal');
    await expect(page).toHaveURL(/\/overview$/);
  }
  await page.evaluate(() => {
    localStorage.setItem('cortexa:introduction:v1:welcome', 'seen');
    localStorage.setItem('cortexa:introduction:v1:chat', 'seen');
  });
  await page.goto('/ai');
  await expect(page.getByRole('textbox', { name: 'Sua pergunta', exact: true })).toBeVisible();
}
