import type { Page } from '@playwright/test';
import { test, expect, personalStorageKey } from './fixtures';
import { ensurePersonalWorkspace } from './workspace-helpers';

test.use({ workspace: 'seeded' });

async function personal(page: Page) {
  await ensurePersonalWorkspace(page);
  await page.getByRole('tab', { name: 'Visão geral', exact: true }).click();
  await expect(page.getByText('PESSOAL · LOCAL', { exact: true })).toBeVisible();
}
const text =
  'Organização\nConceito principal\nUma ligação importante\n\nRevisão\nRetomar as anotações';

test('transcript → editable map → persisted slides → delete, preserving the source', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await personal(page);
  await page.goto('/studio?kind=transcript');
  await page.getByRole('button', { name: 'Adicionar transcrição', exact: true }).click();
  await page
    .getByRole('textbox', { name: 'Título do documento', exact: true })
    .fill('Aula de organização');
  await page.getByRole('textbox', { name: 'Conteúdo do documento', exact: true }).fill(text);
  await page.getByRole('button', { name: 'Salvar documento', exact: true }).click();
  await expect(
    page.getByText('CONTEÚDO INSERIDO POR VOCÊ · SEM IA', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Criar material de estudo', exact: true }).click();
  await page.getByRole('button', { name: 'Criar Mapas mentais', exact: true }).click();
  await expect(
    page.getByRole('textbox', { name: 'Conteúdo do documento', exact: true }),
  ).toHaveValue(text);
  await page
    .getByRole('textbox', { name: 'Título do documento', exact: true })
    .fill('Mapa da aula');
  await page.getByRole('button', { name: 'Salvar documento', exact: true }).click();
  await expect(page.getByText('• Uma ligação importante', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Ampliar mapa', exact: true }).click();
  await page.reload();
  await expect(page.getByText('• Uma ligação importante', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Editar documento', exact: true }).click();
  await page
    .getByRole('textbox', { name: 'Conteúdo do documento', exact: true })
    .fill(text + '\n\nPróximo passo\nRevisar amanhã');
  await page.getByRole('button', { name: 'Salvar documento', exact: true }).click();
  await expect(page.getByText('• Revisar amanhã', { exact: true })).toBeVisible();
  await page.screenshot({ path: 'docs/screenshots/pastel-mindmap-mobile.png' });
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page.screenshot({ path: 'docs/screenshots/pastel-mindmap-desktop.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Criar material de estudo', exact: true }).click();
  await page.getByRole('button', { name: 'Criar Slides', exact: true }).click();
  await page
    .getByRole('textbox', { name: 'Título do documento', exact: true })
    .fill('Apresentação da aula');
  await page.getByRole('button', { name: 'Salvar documento', exact: true }).click();
  await expect(page.getByText('1 / 3', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Próximo slide', exact: true }).click();
  await expect(page.getByText('Retomar as anotações', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Próximo slide', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Próximo slide', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Excluir documento', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar exclusão', exact: true }).click();
  await expect(page.getByText('Sua biblioteca', { exact: true })).toBeVisible();
  await page.goto('/studio?kind=slides');
  await expect(page.getByText('Espaço para sua próxima ideia', { exact: true })).toBeVisible();
  await page.goto('/studio?kind=transcript');
  await expect(
    page.getByRole('button', { name: 'Abrir Aula de organização', exact: true }),
  ).toBeVisible();
  await page.goto('/studio?kind=mindmap');
  await expect(page.getByRole('button', { name: 'Abrir Mapa da aula', exact: true })).toBeVisible();
});

test('manual cards and questions feed practice and survive a reload without AI', async ({
  page,
}) => {
  await personal(page);
  await page.goto('/material/add');
  await page.getByRole('textbox', { name: 'Título', exact: true }).fill('Conceitos da aula');
  await page
    .getByRole('textbox', { name: 'Anotação', exact: true })
    .fill('Organização e revisão dos conceitos.');
  await page.getByRole('button', { name: 'Salvar anotação', exact: true }).click();
  await page.getByRole('button', { name: 'Criar material de estudo', exact: true }).click();
  await page.getByRole('button', { name: 'Criar Flashcards', exact: true }).click();
  await page
    .getByRole('textbox', { name: 'Frente do flashcard', exact: true })
    .fill('Qual é o meu próximo passo?');
  await page
    .getByRole('textbox', { name: 'Verso do flashcard', exact: true })
    .fill('Revisar as ideias da aula.');
  await page.getByRole('button', { name: 'Salvar flashcard', exact: true }).click();
  await page.getByRole('button', { name: 'Virar flashcard', exact: true }).click();
  await expect(page.getByText('Revisar as ideias da aula.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: /Fácil/ }).click();
  await page.goto('/compose?kind=assessment');
  await page
    .getByRole('textbox', { name: 'Enunciado', exact: true })
    .fill('Qual tema quero revisar?');
  for (const [index, answer] of ['Tema A', 'Tema B', 'Tema C', 'Tema D'].entries())
    await page
      .getByRole('textbox', { name: `Alternativa ${'ABCD'[index]}`, exact: true })
      .fill(answer);
  await page.getByRole('button', { name: 'Resposta B', exact: true }).click();
  await page
    .getByRole('textbox', { name: 'Explicação da resposta', exact: true })
    .fill('Escolhi revisar o tema B.');
  await page.getByRole('button', { name: 'Salvar questão', exact: true }).click();
  await expect(page.getByText('Monte sua sessão.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Iniciar sessão', exact: true }).click();
  await page.getByRole('radio', { name: 'B. Tema B', exact: true }).click();
  await page.getByRole('button', { name: 'Responder', exact: true }).click();
  await page.getByRole('button', { name: 'Tinha certeza', exact: true }).click();
  await expect(page.getByText('Você acertou.', { exact: true })).toBeVisible();
  await page.goto('/overview');
  await expect(page.getByTestId('overview-stat-2')).toContainText('1');
  await expect(page.getByTestId('overview-stat-2')).toContainText('questões respondidas');
  await page.reload();
  await page.goto('/questions');
  await page.getByRole('button', { name: 'Retomar sessão', exact: true }).click();
  await expect(page.getByText('Qual tema quero revisar?', { exact: true })).toBeVisible();
  await page.goto('/ai');
  await page
    .getByRole('textbox', { name: 'Sua pergunta', exact: true })
    .fill('Uma pergunta pessoal');
  await page.getByRole('button', { name: 'Enviar pergunta', exact: true }).click();
  await expect(
    page.getByText('O tutor ainda não está disponível neste ambiente.', { exact: true }),
  ).toBeVisible();
  const conversations = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) ?? '{}').conversations,
    personalStorageKey,
  );
  expect(conversations).toHaveLength(1);
  expect(conversations[0].messages).toHaveLength(1);
  expect(conversations[0].messages[0].role).toBe('user');
});

test('desktop sidebar, centered creation menu and pastel tools fit phone, tablet and desktop', async ({
  page,
}) => {
  test.setTimeout(120000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page.goto('/overview');
  await page.getByRole('button', { name: 'Mover navegação à esquerda', exact: true }).click();
  await page.getByRole('button', { name: /^Criar material →$/ }).click();
  await expect(
    page.getByRole('dialog', { name: 'Criar material de estudo', exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: 'docs/screenshots/pastel-create-desktop.png' });
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.screenshot({ path: 'docs/screenshots/pastel-home-desktop.png' });
  await page.getByRole('button', { name: 'Mapas mentais', exact: true }).click();
  await expect(page).toHaveURL(/studio\?kind=mindmap/);
  for (const width of [360, 768]) {
    await page.setViewportSize({ width, height: 950 });
    for (const route of [
      '/overview',
      '/study',
      '/ai',
      '/studio?kind=transcript',
      '/studio?kind=mindmap',
      '/studio?kind=slides',
      '/compose?kind=assessment',
    ]) {
      await page.goto(route);
      if (route === '/ai')
        await expect(
          page.getByRole('textbox', { name: 'Sua pergunta', exact: true }),
        ).toBeVisible();
      else await expect(page.getByText('PESSOAL · LOCAL', { exact: true })).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true);
    }
    await page.goto('/overview');
    await expect(page.getByText('Olá, Victor.', { exact: true })).toBeVisible();
    await page.screenshot({ path: `docs/screenshots/pastel-home-${width}.png` });
  }
  expect(errors).toEqual([]);
});
