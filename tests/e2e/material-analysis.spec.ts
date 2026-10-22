import { test, expect, personalStorageKey, simulatedOrigin } from './fixtures';
import { ensurePersonalWorkspace } from './workspace-helpers';

test('authenticated note exposes analysis failure without fabricating concepts or losing the source', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  let requests = 0;
  await page.route(`${simulatedOrigin}/functions/v1/ai-material-analysis`, (route) => {
    requests++;
    expect(route.request().headers().authorization).toMatch(/^Bearer /);
    expect(route.request().postDataJSON().operation).toBe('analyze');
    return route.fulfill({ status: 404, json: { code: 'unavailable' } });
  });
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
  await expect(popup.getByRole('button', { name: 'Analisar esta anotação' })).toBeVisible();
  await popup.getByRole('button', { name: 'Analisar esta anotação', exact: true }).click();
  await expect(
    popup.getByRole('button', { name: 'Tentar análise novamente', exact: true }),
  ).toBeVisible();
  expect(requests).toBe(1);
  await expect(
    popup.getByRole('button', { name: 'Conferi e quero salvar os conceitos', exact: true }),
  ).toHaveCount(0);
  const snapshot = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) ?? '{}'),
    personalStorageKey,
  );
  expect(snapshot.materials).toHaveLength(1);
  expect(snapshot.materials[0].analysis).toBeUndefined();
  expect(snapshot.attempts).toHaveLength(0);
  await popup.getByRole('button', { name: 'Fechar', exact: true }).click();
  await expect(popup).toHaveCount(0);
  await expect(page).toHaveURL(/\/material\/note-/);
  await page.reload();
  await expect(
    page.getByText('Texto pessoal de estudo, sem dados de pacientes.', { exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
