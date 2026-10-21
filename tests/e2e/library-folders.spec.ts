import { test, expect } from '@playwright/test';
import { demonstrationStorage } from './workspace-helpers';

test.use({ storageState: demonstrationStorage });

test('library creates a colored folder, groups materials and expands search from the right', async ({
  page,
}) => {
  await page.goto('/library');
  await expect(page.getByTestId('workspace-tool-dock')).toHaveCount(0);
  await page.getByRole('button', { name: 'Nova pasta', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Criar pasta', exact: true })).toBeVisible();
  await page.getByRole('textbox', { name: 'Nome da pasta', exact: true }).fill('Caderno Azul');
  await expect(page.getByText('Azul', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Azul', exact: true }).click();
  await page.getByRole('button', { name: 'Criar pasta', exact: true }).click();
  const folder = page.getByRole('button', { name: 'Caderno Azul', exact: true });
  await expect(folder).toBeVisible();
  await expect(folder).toHaveAttribute('aria-pressed', 'true');
  await expect(folder.getByText('Caderno Azul', { exact: true })).toBeVisible();
  expect((await folder.boundingBox())?.height).toBeGreaterThanOrEqual(68);
  await expect(page.getByRole('button', { name: 'Sem pasta', exact: true })).toHaveCount(0);

  await page.getByRole('button', { name: 'Todas as pastas', exact: true }).click();
  await page.getByRole('button', { name: 'Fisiologia Renal.pdf', exact: true }).click();
  await page.getByRole('button', { name: 'Caderno Azul', exact: true }).click();
  await expect(page.getByText('Organização atualizada.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Voltar', exact: true }).click();
  await expect(page.getByText('Caderno Azul', { exact: true }).first()).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Fisiologia Renal.pdf', exact: true }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Buscar na biblioteca', exact: true }).click();
  const search = page.getByRole('textbox', { name: 'Buscar na biblioteca', exact: true });
  await expect(search).toBeVisible();
  await search.fill('Fisiologia Renal');
  await expect(
    page.getByRole('button', { name: 'Fisiologia Renal.pdf', exact: true }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Caderno Azul', exact: true }).click();
  await page.getByRole('button', { name: 'Remover pasta', exact: true }).click();
  const deleteDialog = page.getByRole('dialog', { name: 'Excluir pasta?', exact: true });
  await expect(deleteDialog).toBeVisible();
  await expect(deleteDialog.getByText('Caderno Azul', { exact: true })).toBeVisible();
  await deleteDialog.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Caderno Azul', exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Remover pasta', exact: true }).click();
  await page
    .getByRole('dialog', { name: 'Excluir pasta?', exact: true })
    .getByRole('button', { name: 'Excluir pasta', exact: true })
    .click();
  await expect(page.getByRole('button', { name: 'Caderno Azul', exact: true })).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Fisiologia Renal.pdf', exact: true }),
  ).toBeVisible();

  for (const width of [360, 768]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  }
});

test('desktop navigation stretches to the window without the repeated tools panel', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/overview');
  const moveLeft = page.getByRole('button', { name: 'Mover navegação à esquerda', exact: true });
  await expect(moveLeft).toBeVisible();
  await moveLeft.click();
  await expect(
    page.getByRole('button', { name: 'Recolher navegação lateral', exact: true }),
  ).toBeVisible();

  const sidebar = page.getByTestId('desktop-sidebar');
  await expect(sidebar).toBeVisible();
  expect((await sidebar.boundingBox())?.height).toBeGreaterThanOrEqual(899);
  await expect(page.getByTestId('workspace-tool-dock')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );

  await page.goto('/studio?kind=mindmap');
  await expect(page.getByTestId('workspace-tool-dock')).toHaveCount(0);
});
