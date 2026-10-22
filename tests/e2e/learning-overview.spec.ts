import { test, expect, mockTutorReply } from './fixtures';
import { ensurePersonalWorkspace } from './workspace-helpers';

test.use({ workspace: 'seeded' });

test('tool back follows its origin and nested screens return one step at a time', async ({
  page,
}) => {
  await page.goto('/study');
  await expect(page.getByText('Ferramentas do seu estúdio', { exact: true })).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Explorar Transcrições', exact: true }),
  ).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Questões', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Questões', exact: true }).click();
  await expect(page).toHaveURL(/\/questions/);
  await page.getByRole('button', { name: 'Voltar', exact: true }).click();
  await expect(page).toHaveURL(/\/study$/);

  await page.goto('/overview');
  await page.getByRole('button', { name: 'Explorar Slides', exact: true }).click();
  await page.getByRole('button', { name: 'Voltar', exact: true }).click();
  await expect(page).toHaveURL(/\/overview$/);
  await page.getByRole('button', { name: 'Explorar Avaliações', exact: true }).click();
  await page.getByRole('button', { name: 'Voltar', exact: true }).click();
  await expect(page).toHaveURL(/\/overview$/);
});

test('direct study tools return to Study and nested flashcard creation returns one step', async ({
  page,
}) => {
  for (const route of [
    '/questions',
    '/flashcards',
    '/mistakes',
    '/knowledge',
    '/session',
    '/planner',
  ]) {
    await page.goto(route);
    await expect(page.getByTestId('navigation-trail').filter({ visible: true })).toHaveAttribute(
      'aria-label',
      /^Você está em: Estudar > /,
    );
    await page.getByRole('button', { name: 'Voltar', exact: true }).click();
    await expect(page).toHaveURL(/\/study$/);
  }
  await page.getByRole('button', { name: 'Flashcards', exact: true }).click();
  await page.getByRole('button', { name: 'Criar flashcard', exact: true }).click();
  await expect(page.getByTestId('navigation-trail').filter({ visible: true })).toHaveAttribute(
    'aria-label',
    'Você está em: Estudar > Flashcards > Criar flashcard',
  );
  await page.getByRole('button', { name: 'Voltar', exact: true }).click();
  await expect(page).toHaveURL(/\/flashcards$/);
  await page.getByRole('button', { name: 'Voltar', exact: true }).click();
  await expect(page).toHaveURL(/\/study$/);
  await page.goto('/topic/acid');
  await page.getByRole('button', { name: 'Voltar', exact: true }).click();
  await expect(page).toHaveURL(/\/knowledge$/);
  await page.getByRole('button', { name: 'Ir para Estudar', exact: true }).click();
  await expect(page).toHaveURL(/\/study$/);
});

test('review priorities open a popup and the daily study card remains compact', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/overview');
  await expect(page.getByText('SEU PRÓXIMO PASSO', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: /^Equilíbrio ácido-base, \d+%$/ }).click();
  const popup = page.getByRole('dialog', { name: 'Equilíbrio ácido-base', exact: true });
  await expect(popup).toBeVisible();
  await expect(page).toHaveURL(/\/overview$/);
  await popup.getByRole('button', { name: 'Fechar Equilíbrio ácido-base', exact: true }).click();
  await expect(popup).toHaveCount(0);
  await page.getByRole('button', { name: /^Equilíbrio ácido-base, \d+%$/ }).click();
  await popup.getByRole('button', { name: 'Estudar agora', exact: true }).click();
  await expect(page).toHaveURL(/\/session\?.*topicId=acid/);
  await page.getByRole('button', { name: 'Voltar', exact: true }).click();
  await expect(page).toHaveURL(/\/overview$/);
});

test('personal study does not expose the scripted demonstration tutor', async ({ page }) => {
  await page.goto('/overview');
  await expect(page.getByRole('button', { name: /Abrir tutor de demonstra/ })).toHaveCount(0);
  await page.goto('/session?topicId=acid');
  await expect(
    page.getByRole('button', { name: 'Me ensine com perguntas', exact: true }),
  ).toBeDisabled();
  await page.goto('/tutor');
  await expect(page).toHaveURL(/\/tutor$/);
  await expect(
    page.getByText('A tutoria com IA ainda não está conectada ao seu espaço pessoal.', {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByText('ROTEIRO SIMULADO', { exact: true })).toHaveCount(0);
});

test('sidebar has one conversation entry and tool back preserves the current tab', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/overview');
  await page.getByRole('button', { name: 'Mover navegação à esquerda', exact: true }).click();
  await page.setViewportSize({ width: 1024, height: 900 });
  await expect(page.getByText('Cortexa', { exact: true })).toHaveCount(1);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(page.getByRole('tab', { name: 'Conversar', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Chat de estudo', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Mapas mentais', exact: true }).click();
  await page.getByRole('button', { name: 'Voltar', exact: true }).click();
  await expect(page).toHaveURL(/\/overview$/);
  await page.getByRole('button', { name: 'Biblioteca', exact: true }).click();
  await page.getByRole('button', { name: 'Flashcards', exact: true }).click();
  await expect(page.getByRole('tab', { name: 'Estudar', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(page.getByTestId('navigation-trail').filter({ visible: true })).toHaveAttribute(
    'aria-label',
    'Você está em: Estudar > Flashcards',
  );
  await page.getByRole('button', { name: 'Voltar', exact: true }).click();
  await expect(page).toHaveURL(/\/library$/);
});

test('calendar records real study and subject filters update the chart, including empty subjects', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page.goto('/overview');
  const calendar = page.getByTestId('study-calendar');
  await expect(calendar).toBeVisible();
  const calendarCard = page.getByTestId('study-calendar-card');
  const calendarBox = await calendarCard.boundingBox();
  const firstStatBox = await page.getByTestId('overview-stat-0').boundingBox();
  expect(calendarBox?.x).toBeGreaterThan(550);
  expect(calendarBox?.height).toBeLessThan(400);
  expect(firstStatBox?.y).toBeGreaterThan(calendarBox?.y ?? 0);
  await expect(page.getByText('Seu progresso', { exact: true })).toBeVisible();
  await expect(page.getByTestId('weekly-goal-indicator')).toHaveAccessibleName(
    'Meta semanal: 0 de 180 minutos',
  );
  await expect(page.getByText('Sua semana', { exact: true })).toHaveCount(0);
  expect((await calendar.boundingBox())?.y).toBeLessThan(600);
  await expect(calendar.getByLabel(/: estudo registrado, hoje$/)).toHaveCount(0);
  await expect(page.getByText('Você precisa revisar', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Mês anterior', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Próximo mês', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Próximo mês', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Próximo mês', exact: true })).toBeDisabled();

  await page.goto('/questions?topicId=acid&questionId=q-acid-1');
  await page.getByRole('button', { name: 'Iniciar sessão', exact: true }).click();
  await page.getByRole('radio').first().click();
  await page.getByRole('button', { name: 'Responder', exact: true }).click();
  await page.getByRole('button', { name: 'Tinha certeza', exact: true }).click();
  await expect(page.getByText(/Alternativa correta:/)).toBeVisible();
  await page.goto('/overview');
  await expect(calendar.getByLabel(/: estudo registrado, hoje$/)).toHaveCount(1);
  await page.screenshot({ path: 'docs/screenshots/learning-overview-desktop.png' });
  for (const width of [360, 768, 1376]) {
    await page.setViewportSize({ width, height: 1032 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 1000 });
  await page.screenshot({ path: 'docs/screenshots/learning-overview-mobile.png' });
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page.getByRole('button', { name: /^Ver conhecimento/ }).click();
  const chart = page.getByTestId('accuracy-chart');
  await expect(chart).toHaveAttribute('aria-label', /Fisiologia: \d+%/);
  await expect
    .poll(async () => (await page.getByTestId('accuracy-fill-1').boundingBox())?.height ?? 0)
    .toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Cardiologia', exact: true }).click();
  await expect(chart).toHaveAttribute('aria-label', /Cardiologia: sem respostas/);
  await expect(
    page.getByText('Ainda sem respostas nesta disciplina', { exact: true }),
  ).toBeVisible();
  await expect
    .poll(async () => (await page.getByTestId('accuracy-fill-0').boundingBox())?.height ?? 0)
    .toBeLessThan(1);
  await page.getByRole('button', { name: 'Fisiologia', exact: true }).click();
  await expect(chart).toHaveAttribute('aria-label', /Fisiologia: \d+%/);
  const label = await page.getByTestId('accuracy-column-1').getAttribute('aria-label');
  const targetHeight = Number(label?.match(/(\d+)%/)?.[1]) * 1.4;
  await expect
    .poll(async () =>
      Math.abs(
        ((await page.getByTestId('accuracy-fill-1').boundingBox())?.height ?? 0) - targetHeight,
      ),
    )
    .toBeLessThan(1.5);
  await page.screenshot({ path: 'docs/screenshots/learning-knowledge-desktop.png' });
  for (const width of [360, 768, 1376]) {
    await page.setViewportSize({ width, height: 1032 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 1000 });
  await page.screenshot({ path: 'docs/screenshots/learning-knowledge-mobile.png' });
  expect(errors).toEqual([]);
});

test('personal calendar and knowledge start empty without borrowing demonstration progress', async ({
  page,
}) => {
  await ensurePersonalWorkspace(page);
  await page.getByRole('tab', { name: 'Visão geral', exact: true }).click();
  await expect(page.getByTestId('study-calendar')).toBeVisible();
  await expect(page.getByTestId('weekly-goal-indicator')).toHaveAccessibleName(
    'Meta semanal: 0 de 150 minutos',
  );
  await expect(page.getByText('0 dias estudados neste mês', { exact: true })).toBeVisible();
  await expect(page.getByText('Você precisa revisar', { exact: true })).toHaveCount(0);
  await page.getByTestId('weekly-goal-indicator').click();
  await expect(page).toHaveURL(/\/profile-edit$/);
  await page.getByRole('button', { name: 'Voltar', exact: true }).click();
  await expect(page).toHaveURL(/\/overview$/);
  await page.getByRole('button', { name: /^Ver conhecimento/ }).click();
  await expect(page.getByTestId('accuracy-chart')).toHaveAttribute('aria-label', /sem respostas/);
  await expect(
    page.getByText('Ainda sem respostas nesta disciplina', { exact: true }),
  ).toBeVisible();
});

test('upcoming exam opens a review popup before the planner', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/overview');
  await page.getByRole('button', { name: 'Organizar revisão', exact: true }).click();
  await expect(
    page.getByRole('dialog', { name: 'Organizar minha revisão', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('dialog', { name: 'Organizar minha revisão' }).getByText('Fisiologia Renal', {
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Configurar plano de revisão', exact: true }).click();
  await expect(page).toHaveURL(/\/planner\?.*examId=/);
});

test('dark theme recolors screen surfaces, progress cards, and email account form', async ({
  page,
}) => {
  await page.goto('/profile');
  await page.getByRole('switch', { name: 'Modo escuro' }).click();
  await expect(page.getByRole('switch', { name: 'Modo escuro' })).toBeChecked();

  await page.goto('/overview');
  await expect(page.getByTestId('screen-root')).toHaveCSS('background-color', 'rgb(10, 10, 15)');
  await expect(page.getByTestId('study-calendar-card')).toHaveCSS(
    'background-color',
    'rgb(21, 20, 27)',
  );
  await expect(page.getByTestId('overview-stat-0')).toHaveCSS(
    'background-color',
    'rgb(33, 24, 50)',
  );

  await page.goto('/account');
  await page.getByRole('button', { name: 'Sair da conta', exact: true }).click();
  await page.goto('/account');
  const email = page.getByRole('textbox', { name: 'E-mail', exact: true });
  await expect(email).toBeVisible();
  await expect(email).toHaveCSS('background-color', 'rgb(21, 20, 27)');
  await expect(email).toHaveCSS('color', 'rgb(245, 242, 250)');
  await expect(email).toHaveCSS('border-top-color', 'rgb(41, 38, 49)');
  await expect(page.getByRole('button', { name: 'Entrar', exact: true })).toHaveCSS(
    'background-color',
    'rgb(124, 58, 237)',
  );
});

test('chat sidebar lists recent student conversations by their question title', async ({
  page,
}) => {
  await mockTutorReply(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/overview');
  await page.getByRole('button', { name: 'Mover navegação à esquerda', exact: true }).click();
  await page.getByRole('tab', { name: 'Conversar', exact: true }).click();
  await expect(page.getByText('RECENTES', { exact: true })).toBeVisible();
  await page
    .getByRole('textbox', { name: 'Sua pergunta', exact: true })
    .fill('Explique equilíbrio ácido-base');
  await page.getByRole('button', { name: 'Enviar pergunta', exact: true }).click();

  const recentChat = page.getByRole('button', {
    name: 'Abrir conversa: Explique equilíbrio ácido-base',
    exact: true,
  });
  await expect(recentChat).toBeVisible();
  await recentChat.click();
  await expect(page).toHaveURL(/conversationId=/);
  await expect(page.getByText('CONVERSA PESSOAL · HISTÓRICO LOCAL', { exact: true })).toBeVisible();
  await expect(page.getByText(/Resposta SIMULADA do transporte E2E/)).toBeVisible();
  await page.goto('/history');
  await expect(page.getByText('Histórico de conversas', { exact: true })).toBeVisible();
  await page.getByText('Explique equilíbrio ácido-base', { exact: true }).click();
  await expect(page).toHaveURL(/\/ai\?conversationId=/);
});
