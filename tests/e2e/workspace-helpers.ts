import { expect, type Page } from '@playwright/test';
import { personalStorageKey } from './fixtures';

export async function ensurePersonalWorkspace(page: Page) {
  // A sessão vem da fixture; este helper limpa só o snapshot desta identidade.
  await page.goto('/account');
  await expect(page.getByRole('button', { name: 'Sair da conta', exact: true })).toBeVisible();
  await page.evaluate((key) => {
    localStorage.removeItem(key);
    localStorage.setItem('cortexa:introduction:v1:welcome', 'seen');
    localStorage.setItem('cortexa:introduction:v1:chat', 'seen');
  }, personalStorageKey);
  await page.goto('/ai');
  await expect(page.getByRole('textbox', { name: 'Sua pergunta', exact: true })).toBeVisible();
}
