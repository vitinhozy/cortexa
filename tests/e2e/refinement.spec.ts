import { test, expect } from './fixtures';

test.use({ workspace: 'seeded' });

test('intro moves forward and back before opening the academic form', async ({ page }) => {
  await page.goto('/account');
  await page.evaluate(() => localStorage.removeItem('cortexa:introduction:v1:welcome'));
  await page.goto('/onboarding');
  await expect(page.getByText('Uma base que é sua', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await expect(page.getByText('No seu ritmo', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Etapa anterior', exact: true }).click();
  await expect(page.getByText('Uma base que é sua', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await page.getByRole('button', { name: 'Personalizar meu estudo', exact: true }).click();
  await expect(
    page.getByRole('textbox', { name: 'Como você quer ser chamado?', exact: true }),
  ).toBeVisible();
});

test('global search opens the selected content and clears to an empty state', async ({ page }) => {
  await page.goto('/search');
  const input = page.getByRole('textbox', { name: 'Buscar em tudo', exact: true });
  await input.fill('equilibrio');
  await page.getByRole('button', { name: 'Assuntos', exact: true }).click();
  await page.getByRole('button', { name: 'Abrir Equilíbrio ácido-base', exact: true }).click();
  await expect(page).toHaveURL(/\/topic\/acid/);
  await page.getByRole('button', { name: 'Voltar', exact: true }).click();
  await expect(page).toHaveURL(/\/search$/);
  await expect(input).toHaveValue('equilibrio');
  await page.goto('/search');
  await input.fill('xyznaoexiste');
  await expect(page.getByText('Ainda não encontramos.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Limpar busca', exact: true }).click();
  await expect(input).toHaveValue('');
  await expect(page.getByText('Tudo começa com uma curiosidade.', { exact: true })).toBeVisible();
  await input.fill('componente primario');
  await page.getByRole('button', { name: 'Questões', exact: true }).click();
  await page.getByRole('button', { name: /Abrir Em uma revisão de gasometria/ }).click();
  await expect(page.getByText('Monte sua sessão.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Iniciar sessão', exact: true }).click();
  await expect(
    page.getByRole('radio', { name: 'C. Redução do bicarbonato', exact: true }),
  ).toBeVisible();
  await page.goto('/search');
  await input.fill('primeira etapa');
  await page.getByRole('button', { name: 'Flashcards', exact: true }).click();
  await page
    .getByRole('button', {
      name: 'Abrir Qual é a primeira etapa ao interpretar uma gasometria?',
      exact: true,
    })
    .click();
  await expect(
    page
      .getByRole('button', { name: 'Virar flashcard', exact: true })
      .getByText('Qual é a primeira etapa ao interpretar uma gasometria?', { exact: true }),
  ).toBeVisible();
  await expect(page.getByText('1 cards restantes', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Voltar', exact: true }).click();
  await expect(page).toHaveURL(/\/search$/);
  await expect(input).toHaveValue('primeira etapa');
});

test('desktop sidebar collapses to an icon rail and small windows stay navigable', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/overview');
  const moveLeft = page.getByRole('button', { name: 'Mover navegação à esquerda', exact: true });
  await expect(moveLeft).toBeVisible();
  await moveLeft.click();
  const collapse = page.getByRole('button', { name: 'Recolher navegação lateral', exact: true });
  await expect(collapse).toBeVisible();
  await collapse.click();
  await expect(
    page.getByRole('button', { name: 'Expandir navegação lateral', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: /Abrir material/ })).toHaveCount(0);

  for (const width of [768, 360]) {
    await page.setViewportSize({ width, height: 840 });
    await expect(page.getByRole('tab', { name: 'Conversar', exact: true })).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  }
  await page.goto('/study');
  await expect(page.getByText('Prática e revisão', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Explorar / })).toHaveCount(0);
});

test('back returns to the screen that opened a material, across tab navigation', async ({
  page,
}) => {
  await page.goto('/overview');
  await page.getByRole('tab', { name: 'Biblioteca', exact: true }).click();
  const material = page.getByRole('button', {
    name: 'Aula 07 — Equilíbrio ácido-base',
    exact: true,
  });
  await expect(material).toBeVisible();
  await material.click();
  await expect(page).toHaveURL(/\/material\//);
  await page.getByRole('button', { name: 'Voltar', exact: true }).click();
  await expect(page).toHaveURL(/\/library$/);
  await expect(page.getByText(/materiais encontrados/).first()).toBeVisible();
});

test('direct tools return to their current parent fallback', async ({ context }) => {
  const cases = [
    ['/studio?kind=transcript', '/library'],
    ['/studio?kind=mindmap', '/library'],
    ['/studio?kind=slides', '/library'],
    ['/studio/edit?kind=transcript', '/studio?kind=transcript'],
    ['/studio/documento-inexistente', '/library'],
    ['/flashcards', '/study'],
    ['/questions', '/study'],
    ['/mistakes', '/study'],
  ] as const;
  for (const [route, expected] of cases) {
    const directPage = await context.newPage();
    try {
      await directPage.goto(route);
      await expect(directPage).toHaveURL('http://localhost:8081' + route);
      await directPage.getByRole('button', { name: 'Voltar', exact: true }).click();
      await expect(directPage).toHaveURL('http://localhost:8081' + expected);
    } finally {
      await directPage.close();
    }
  }
});

test('sheets dismiss by Escape, restore focus and keep the validated account', async ({ page }) => {
  await page.goto('/profile');
  const trigger = page.getByRole('button', { name: 'Lembretes e notificações', exact: true });
  await trigger.click();
  await expect(
    page.getByRole('dialog', { name: 'Lembretes de estudo', exact: true }),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await page.goto('/account');
  await expect(page.getByRole('button', { name: 'Sair da conta', exact: true })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'E-mail', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Continuar com Apple' })).toHaveCount(0);
  await expect(page.getByText(/Conectado como/)).toHaveCount(0);
});

test('notification and motion preferences persist; Plus has no enabled checkout', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/profile');
  await page.getByRole('switch', { name: 'Reduzir movimento', exact: true }).check();
  await page.getByRole('switch', { name: 'Resposta ao toque', exact: true }).uncheck();
  await page.getByRole('button', { name: 'Lembretes e notificações', exact: true }).click();
  await expect(
    page.getByRole('dialog', { name: 'Lembretes de estudo', exact: true }),
  ).toBeVisible();
  await page.getByRole('switch', { name: 'Lembrete diário', exact: true }).check();
  await page.getByRole('button', { name: '21:00', exact: true }).click();
  await page.getByRole('button', { name: 'Salvar preferências', exact: true }).click();
  await page.reload();
  await expect(page.getByRole('switch', { name: 'Reduzir movimento', exact: true })).toBeChecked();
  await expect(
    page.getByRole('switch', { name: 'Resposta ao toque', exact: true }),
  ).not.toBeChecked();
  await page.getByRole('button', { name: 'Lembretes e notificações', exact: true }).click();
  await expect(page.getByRole('button', { name: '21:00', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByText(/nenhum alerta será agendado/)).toBeVisible();
  await page.screenshot({ path: 'docs/screenshots/refinement-reminders.png' });
  await page.getByRole('button', { name: 'Fechar Lembretes de estudo', exact: true }).click();
  await page.getByRole('button', { name: 'Conhecer Cortexa Plus', exact: true }).click();
  await page.getByRole('button', { name: 'Mensal', exact: true }).click();
  await expect(
    page.getByText('Plano mensal · valores ainda não definidos', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Assinatura em breve', exact: true }),
  ).toBeDisabled();
  await page.getByRole('button', { name: 'Continuar com o acesso gratuito', exact: true }).click();
  await expect(page).toHaveURL(/\/profile$/);
});

test('library sheet closes by drag or backdrop and reduced motion avoids press scaling', async ({
  page,
}) => {
  await page.goto('/library');
  await page.getByRole('button', { name: 'Filtros', exact: true }).click();
  const heading = page.getByRole('heading', { name: 'Filtrar biblioteca', exact: true });
  await heading.hover();
  const box = await heading.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box!.x + 30, box!.y + 10);
  await page.mouse.down();
  await page.mouse.move(box!.x + 30, box!.y + 150, { steps: 12 });
  await page.mouse.up();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Filtros', exact: true }).click();
  await page
    .getByRole('button', { name: 'Fechar painel', exact: true })
    .click({ position: { x: 15, y: 15 } });
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const add = page.getByRole('button', { name: 'Adicionar material', exact: true });
  await add.scrollIntoViewIfNeeded();
  const bounds = await add.boundingBox();
  await page.mouse.move(bounds!.x + 30, bounds!.y + 20);
  await page.mouse.down();
  await expect(add).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)');
  await page.mouse.up();
});

test('new surfaces fit narrow phones and tablets without runtime errors', async ({ page }) => {
  // Capturas estáticas: o movimento é exercitado nos testes de interação acima.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  for (const width of [360, 768]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ['/onboarding', '/search', '/membership', '/account']) {
      await page.goto(route);
      if (route === '/account')
        await expect(
          page.getByRole('button', { name: 'Sair da conta', exact: true }),
        ).toBeVisible();
      else await expect(page.getByText('PESSOAL · LOCAL', { exact: true })).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true);
      await page.screenshot({ path: `docs/screenshots/refinement-${route.slice(1)}-${width}.png` });
    }
  }
  await page.setViewportSize({ width: 1376, height: 1032 });
  await page.goto('/ai');
  const prompt = page.getByRole('textbox', { name: 'Sua pergunta', exact: true });
  await expect(prompt).toBeVisible();
  expect((await prompt.boundingBox())?.width).toBeGreaterThan(700);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  expect(errors).toEqual([]);
});
