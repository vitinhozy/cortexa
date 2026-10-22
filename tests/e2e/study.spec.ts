import { test, expect } from './fixtures';

test.use({ workspace: 'seeded' });
test('tab navigation and completing a correct question session', async ({ page }) => {
  await page.goto('/overview');
  for (const tab of ['Estudar', 'Biblioteca', 'Conversar', 'Perfil', 'Visão geral']) {
    await page.getByRole('tab', { name: tab, exact: true }).click();
    await expect(page.getByRole('tab', { name: tab, exact: true })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  }
  await page.goto('/questions?topicId=raas');
  await page.getByRole('button', { name: 'Iniciar sessão', exact: true }).click();
  await page.getByRole('radio', { name: 'B. Renina', exact: true }).click();
  await page.getByRole('button', { name: 'Responder', exact: true }).click();
  await page.getByRole('button', { name: 'Tinha certeza', exact: true }).click();
  await expect(page.getByText('Você acertou.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Ver resultado', exact: true }).click();
  await expect(page.getByText('1 / 1 questões', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Revisar meus erros', exact: true }).click();
  await expect(page.getByText('Um novo começo', { exact: true })).toBeVisible();
});
test('wrong answer → mistake → flashcard → persisted knowledge', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/overview');
  await expect(page.getByText('Olá, Victor.', { exact: true })).toBeVisible();
  await page.goto('/session?topicId=acid');
  await page.getByRole('button', { name: 'Praticar questões', exact: true }).click();
  await expect(page.getByText('Monte sua sessão.', { exact: true })).toBeVisible();
  await page.goto('/questions?topicId=acid&questionId=q-acid-1');
  await page.getByRole('button', { name: 'Iniciar sessão', exact: true }).click();
  await page.getByRole('radio', { name: /^A\. Hipoventilação/ }).click();
  await page.getByRole('button', { name: 'Responder', exact: true }).click();
  await page.getByRole('button', { name: 'Tinha certeza', exact: true }).click();
  await expect(page.getByText('Alternativa correta: B')).toBeVisible();
  await page.getByRole('button', { name: 'Criar flashcard deste erro', exact: true }).click();
  await expect(
    page.getByText('Flashcard salvo! Ele já está disponível na sua revisão.'),
  ).toBeVisible();
  await page.goto('/mistakes');
  await expect(page.getByText(/2 erros registrados/)).toBeVisible();
  await page.goto('/knowledge');
  const knowledge = page.getByRole('button', { name: /^Equilíbrio ácido-base, \d+%$/ });
  await expect(knowledge).toBeVisible();
  const mastery = await knowledge.getAttribute('aria-label');
  await page.reload();
  await expect(knowledge).toHaveAttribute('aria-label', mastery!);
  await page.goto('/flashcards');
  await expect(page.getByText('9 cards restantes')).toBeVisible();
  await page.getByRole('button', { name: 'Virar flashcard', exact: true }).click();
  await expect(
    page.getByText('Hiperventilação com redução da PaCO₂.', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: /Fácil/ }).click();
  await expect(page.getByText('8 cards restantes')).toBeVisible();
  expect(errors).toEqual([]);
});
test('personal notes open a study session; scripted tutoring remains unavailable', async ({
  page,
}) => {
  await page.goto('/library');
  await page.getByRole('button', { name: 'Adicionar material', exact: true }).click();
  await page.getByRole('textbox', { name: 'Título', exact: true }).fill('Revisão demonstrativa');
  await page
    .getByRole('textbox', { name: 'Anotação', exact: true })
    .fill('O bicarbonato diminui na acidose metabólica.');
  await page.getByRole('button', { name: 'Salvar anotação', exact: true }).click();
  await expect(page.getByText('Sua anotação', { exact: true })).toBeVisible();
  const materialId = page.url().split('/').at(-1);
  await page.getByRole('button', { name: 'Estudar anotação', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/session\\?.*materialId=${materialId}$`));
  await expect(
    page.getByText('O bicarbonato diminui na acidose metabólica.', { exact: true }).last(),
  ).toBeVisible();
  await expect(
    page.getByText(
      'Anotação escrita por você. Nenhum resumo ou conteúdo adicional foi gerado por IA.',
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Me ensine com perguntas', exact: true }),
  ).toBeDisabled();
  await page.goto('/tutor');
  await expect(
    page.getByText('A tutoria com IA ainda não está conectada ao seu espaço pessoal.', {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Ele aumenta', exact: true })).toHaveCount(0);
});
test('planner validates inputs and generates a 30-minute revision', async ({ page }) => {
  await page.goto('/planner?urgent=true');
  await page.getByRole('textbox', { name: 'Personalizado (minutos)', exact: true }).fill('0');
  await page.getByRole('button', { name: 'Gerar meu plano', exact: true }).click();
  await expect(
    page.getByText('Selecione ao menos um assunto e de 5 a 480 minutos por dia.'),
  ).toBeVisible();
  await page.getByRole('button', { name: '30 min', exact: true }).click();
  await page.getByRole('button', { name: 'Gerar meu plano', exact: true }).click();
  await expect(page.getByText('SEU PLANO ESTÁ PRONTO')).toBeVisible();
  await page.getByRole('button', { name: 'Começar plano', exact: true }).click();
  await expect(page.getByText('Primeiro, conecte o conceito.')).toBeVisible();
});
test('study keeps practice tools and opens urgent review as a sheet', async ({ page }) => {
  await page.goto('/study');
  await expect(page.getByRole('button', { name: 'Abrir Transcrições', exact: true })).toHaveCount(
    0,
  );
  await page.getByRole('button', { name: 'Montar revisão de véspera', exact: true }).click();
  await expect(page.getByText('Sua prova é amanhã.', { exact: true })).toBeVisible();
  await expect(page.getByText('Ferramentas do seu estúdio', { exact: true })).toHaveCount(0);
  await expect(
    page.getByRole('textbox', { name: 'Personalizado (minutos)', exact: true }),
  ).toBeVisible();
  await expect(page.getByText('Assuntos da prova', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Abrir último plano salvo', exact: true }),
  ).toHaveCount(0);
  await page.getByRole('button', { name: 'Fechar Sua prova é amanhã.', exact: true }).click();
  await expect(page).toHaveURL(/\/study$/);
  await expect(page.getByText('Prática e revisão', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Explorar Transcrições', exact: true }),
  ).toHaveCount(0);
});
test('tabs and responsive home render without overflow or console errors', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  for (const route of [
    '/overview',
    '/study',
    '/library',
    '/ai',
    '/profile',
    '/knowledge',
    '/mistakes',
    '/questions',
    '/flashcards',
  ]) {
    await page.goto(route);
    if (route === '/ai')
      await expect(page.getByRole('textbox', { name: 'Sua pergunta', exact: true })).toBeVisible();
    else await expect(page.getByText('PESSOAL · LOCAL', { exact: true })).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  }
  await page.goto('/overview');
  await page.screenshot({ path: 'docs/screenshots/home-mobile.png', fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page.screenshot({ path: 'docs/screenshots/home-desktop.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  expect(errors).toEqual([]);
});
