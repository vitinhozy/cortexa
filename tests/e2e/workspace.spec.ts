import type { Page } from '@playwright/test';
import { test, expect, personalStorageKey } from './fixtures';
import { ensurePersonalWorkspace } from './workspace-helpers';

async function openPersonal(page: Page) {
  await ensurePersonalWorkspace(page);
  await page.getByRole('tab', { name: 'Visão geral', exact: true }).click();
  await expect(page.getByText('PESSOAL · LOCAL', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Configurar meu estudo', exact: true }),
  ).toBeVisible();
}

test('a validated first account can complete introductions and use the personal dashboard', async ({
  page,
}) => {
  await page.goto('/account');
  await page.evaluate(() => {
    localStorage.removeItem('cortexa:introduction:v1:welcome');
    localStorage.removeItem('cortexa:introduction:v1:chat');
  });
  await page.goto('/onboarding');
  await expect(page).toHaveURL(/\/onboarding$/);
  await expect(page.getByRole('heading', { name: /Menos dispersão/ })).toBeVisible();
  await page.getByRole('button', { name: 'Pular introdução', exact: true }).click();
  await expect(page).toHaveURL(/\/overview$/);
  await expect(page.getByText(/PESSOAL/)).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Configurar meu estudo', exact: true }),
  ).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('cortexa:introduction:v1:welcome'))).toBe(
    'seen',
  );
  await page.getByRole('tab', { name: 'Conversar', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Converse para estudar' })).toBeVisible();
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Privacidade na conversa' })).toBeVisible();
  await page.getByRole('button', { name: 'Pular introdução', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('cortexa:introduction:v1:chat'))).toBe(
    'seen',
  );
  await page
    .getByRole('textbox', { name: 'Sua pergunta', exact: true })
    .fill('Explique um conceito');
  await page.getByRole('button', { name: 'Enviar pergunta', exact: true }).click();
  await expect(page.getByText('O tutor ainda não está disponível neste ambiente.')).toBeVisible();
  await expect(page.getByText('CORTEXA · DEMONSTRAÇÃO', { exact: true })).toHaveCount(0);
});

test('a validated account uses personal data even with a saved demonstration preference', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem('cortexa:workspace', 'demo');
  });
  await page.goto('/overview');
  await expect(page.getByText(/PESSOAL/)).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Configurar meu estudo', exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByText(/PESSOAL/)).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Explorar demonstração', exact: true }),
  ).toHaveCount(0);
});

async function addNote(page: Page, title = 'Anatomia da aula') {
  await page.goto('/material/add');
  await page.getByRole('button', { name: 'Anatomia', exact: true }).click();
  await page.getByRole('textbox', { name: 'Título', exact: true }).fill(title);
  await page
    .getByRole('textbox', { name: 'Assunto (opcional)', exact: true })
    .fill('Membro superior');
  await page
    .getByRole('textbox', { name: 'Anotação', exact: true })
    .fill('Minha anotação sobre ossos da aula de anatomia.');
  await page.getByRole('button', { name: 'Salvar anotação', exact: true }).click();
  await expect(page.getByText('Sua anotação', { exact: true })).toBeVisible();
}

test('personal onboarding persists in the validated identity without importing demo progress', async ({
  page,
}) => {
  await openPersonal(page);
  await page.getByRole('button', { name: 'Configurar meu estudo', exact: true }).click();
  await page.getByRole('button', { name: 'Começar meu estudo', exact: true }).click();
  await expect(
    page.getByText('Nome: informe de 1 a 80 caracteres.', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Adicionar contexto (opcional)', exact: true }).click();
  await page.getByRole('textbox', { name: 'Como você quer ser chamado?', exact: true }).fill('Ana');
  await page.getByRole('textbox', { name: 'Semestre', exact: true }).fill('3');
  await page
    .getByRole('textbox', { name: 'Seu objetivo', exact: true })
    .fill('Revisar as aulas da semana');
  await page.getByRole('textbox', { name: 'Minutos de estudo por dia', exact: true }).fill('45');
  await page.getByRole('button', { name: 'Anatomia', exact: true }).click();
  await page.getByRole('button', { name: 'Começar meu estudo', exact: true }).click();
  await expect(page.getByText('Olá, Ana.', { exact: true })).toBeVisible();
  await page.getByRole('tab', { name: 'Conversar', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Sua pergunta', exact: true })).toBeVisible();
  await page.getByRole('tab', { name: 'Visão geral', exact: true }).click();
  await expect(page.getByText('Olá, Ana.', { exact: true })).toBeVisible();
  await expect(page.getByTestId('weekly-goal-indicator')).toHaveAccessibleName(
    'Meta semanal: 0 de 225 minutos',
  );
  await page.goto('/profile');
  await page.getByRole('button', { name: 'Editar perfil acadêmico', exact: true }).click();
  await page
    .getByRole('textbox', { name: 'Como você quer ser chamado?', exact: true })
    .fill('Ana Silva');
  await page.getByRole('button', { name: 'Salvar perfil', exact: true }).click();
  await expect(page.getByText('Ana Silva', { exact: true })).toBeVisible();
  await page.goto('/overview');
  await expect(page.getByText('Olá, Ana Silva.', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText('Olá, Ana Silva.', { exact: true })).toBeVisible();
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key) ?? '{}').user?.name,
      personalStorageKey,
    ),
  ).toBe('Ana Silva');
  expect(await page.evaluate(() => localStorage.getItem('cortexa:personal:local:v1'))).toBeNull();
  expect(await page.evaluate(() => localStorage.getItem('cortexa:demo:v1'))).toBeNull();
  await expect(page.getByText('Olá, Ana Silva.', { exact: true })).toBeVisible();
  await expect(page.getByTestId('weekly-goal-indicator')).toHaveAccessibleName(
    'Meta semanal: 0 de 225 minutos',
  );
});

test('library folder → note → favorite → move → search → rename → reload', async ({ page }) => {
  await openPersonal(page);
  await page.goto('/library');
  await page.getByRole('button', { name: 'Nova pasta', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Criar pasta', exact: true })).toBeVisible();
  await page.getByRole('textbox', { name: 'Nome da pasta', exact: true }).fill('Semestre 3');
  await page.getByRole('button', { name: 'Menta', exact: true }).click();
  await page.getByRole('button', { name: 'Criar pasta', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Criar pasta', exact: true })).toHaveCount(0);
  await expect(page.getByText('Pasta criada e selecionada.', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Semestre 3', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await addNote(page);
  await page.getByRole('button', { name: 'Favoritar material', exact: true }).click();
  await page.getByRole('button', { name: 'Semestre 3', exact: true }).click();
  await expect(page.getByText('Organização atualizada.', { exact: true })).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Remover dos favoritos', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Semestre 3', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.goto('/library');
  await page.getByRole('button', { name: 'Buscar na biblioteca', exact: true }).click();
  await page.getByRole('textbox', { name: 'Buscar na biblioteca', exact: true }).fill('ossos');
  await page.getByRole('button', { name: 'Filtros', exact: true }).click();
  await page.getByRole('button', { name: 'Favoritos', exact: true }).click();
  await page.getByRole('button', { name: 'Anatomia', exact: true }).click();
  await page.getByRole('button', { name: 'Ver 1 material', exact: true }).click();
  await page.getByRole('button', { name: 'Semestre 3', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Anatomia da aula', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Editar pasta selecionada', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Editar pasta', exact: true })).toBeVisible();
  await page.getByRole('textbox', { name: 'Nome da pasta', exact: true }).fill('Anatomia 2026');
  await page.getByRole('button', { name: 'Salvar alterações', exact: true }).click();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Anatomia 2026', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Anatomia 2026', exact: true }).click();
  await page.getByRole('button', { name: 'Remover pasta', exact: true }).click();
  await page
    .getByRole('dialog', { name: 'Excluir pasta?', exact: true })
    .getByRole('button', { name: 'Excluir pasta', exact: true })
    .click();
  await expect(page.getByRole('button', { name: 'Sem pasta', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Anatomia da aula', exact: true })).toBeVisible();
});

test('personal exam connects home, plan and study without fabricated AI or mastery', async ({
  page,
}) => {
  await openPersonal(page);
  await addNote(page);
  await page.goto('/exams');
  await page.getByRole('textbox', { name: 'Nome da prova', exact: true }).fill('Anatomia N1');
  const future = new Date();
  future.setDate(future.getDate() + 5);
  const date = `${future.getFullYear()}-${String(future.getMonth() + 1).padStart(2, '0')}-${String(future.getDate()).padStart(2, '0')}`;
  await page.getByRole('textbox', { name: 'Data (AAAA-MM-DD)', exact: true }).fill(date);
  await page.getByRole('button', { name: 'Anatomia', exact: true }).click();
  await page.getByRole('button', { name: 'Membro superior', exact: true }).click();
  await page.getByRole('button', { name: 'Salvar prova', exact: true }).click();
  await expect(
    page.getByText('Prova salva. Ela já aparece na sua agenda.', { exact: true }),
  ).toBeVisible();
  await page.goto('/overview');
  await expect(page.getByText('Anatomia N1', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Organizar revisão', exact: true }).click();
  await page.getByRole('button', { name: /Configurar plano de revis/ }).click();
  await expect(
    page.getByRole('textbox', { name: 'Data da prova (AAAA-MM-DD)', exact: true }),
  ).toHaveValue(date);
  await page.getByRole('button', { name: 'Gerar meu plano', exact: true }).click();
  await expect(page.getByText('SEU PLANO ESTÁ PRONTO', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Começar plano', exact: true }).click();
  await expect(
    page.getByText('Minha anotação sobre ossos da aula de anatomia.', { exact: true }),
  ).toBeVisible();
  await page.goto('/knowledge');
  await page.getByRole('button', { name: 'Anatomia', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Membro superior, ainda sem prática', exact: true }),
  ).toBeVisible();
  await page.goto('/ai');
  await expect(page.getByRole('button', { name: 'Enviar pergunta', exact: true })).toBeDisabled();
  await page
    .getByRole('textbox', { name: 'Sua pergunta', exact: true })
    .fill('Explique o meu material');
  await page.getByRole('button', { name: 'Enviar pergunta', exact: true }).click();
  await expect(page.getByText('O tutor ainda não está disponível neste ambiente.')).toBeVisible();
  const conversation = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) ?? '{}').conversations?.at(-1),
    personalStorageKey,
  );
  expect(conversation.messages).toHaveLength(1);
  expect(conversation.messages[0].role).toBe('user');
});

test('empty authenticated routes render on phone, tablet and desktop', async ({ page }) => {
  test.setTimeout(120000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await openPersonal(page);
  for (const route of [
    '/study',
    '/library',
    '/ai',
    '/profile',
    '/knowledge',
    '/mistakes',
    '/questions',
    '/flashcards',
    '/session',
    '/planner',
    '/tutor',
    '/exams',
    '/account',
  ]) {
    await page.goto(route);
    if (route === '/ai')
      await expect(page.getByRole('textbox', { name: 'Sua pergunta', exact: true })).toBeVisible();
    else if (route === '/account')
      await expect(page.getByRole('button', { name: 'Sair da conta', exact: true })).toBeVisible();
    else await expect(page.getByText('PESSOAL · LOCAL', { exact: true })).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  }
  await expect(page.getByRole('textbox', { name: 'E-mail', exact: true })).toHaveCount(0);
  await page.goto('/overview');
  for (const width of [360, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await page.screenshot({ path: `docs/screenshots/personal-${width}.png`, fullPage: true });
  }
  expect(errors).toEqual([]);
});
