import type { Page } from '@playwright/test';
import { expect, test, personalStorageKey } from './fixtures';
import { ensurePersonalWorkspace } from './workspace-helpers';

test.use({ workspace: 'seeded' });

async function snapshot(page: Page, key = personalStorageKey) {
  return page.evaluate((storageKey) => JSON.parse(localStorage.getItem(storageKey) ?? '{}'), key);
}
async function personal(page: Page) {
  await ensurePersonalWorkspace(page);
  await page.goto('/onboarding');
}
test('short journey onboarding persists year precision and confirmed transitions without importing demo evidence', async ({
  page,
}) => {
  await personal(page);
  await expect(page.getByRole('textbox', { name: 'Semestre', exact: true })).toHaveCount(0);
  await page.getByRole('textbox', { name: 'Como você quer ser chamado?', exact: true }).fill('Ana');
  await page.getByRole('button', { name: 'Fundamentos da graduação', exact: true }).click();
  await page.getByRole('button', { name: 'Começar meu estudo', exact: true }).click();
  await expect(page).toHaveURL(/\/overview$/);
  await page.getByRole('tab', { name: 'Conversar', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Sua pergunta', exact: true })).toBeVisible();
  await expect.poll(async () => (await snapshot(page)).academicJourney?.stage).toBe('FOUNDATIONS');
  expect((await snapshot(page)).user.subjectIds).toEqual([]);
  await page.goto('/profile-edit');
  await page.getByRole('textbox', { name: 'Ano de ingresso (opcional)', exact: true }).fill('2020');
  await page.getByRole('textbox', { name: 'Semestre', exact: true }).fill('2');
  await page.getByRole('button', { name: 'Salvar perfil', exact: true }).click();
  await page.reload();
  expect((await snapshot(page)).academicJourney.courseEntry).toEqual({
    precision: 'year',
    year: 2020,
  });
  await page.goto('/profile-edit');
  await page.getByRole('button', { name: 'Internato', exact: true }).click();
  await page.getByRole('button', { name: 'Salvar perfil', exact: true }).click();
  await expect(
    page.getByText('Confirme a mudança de etapa. Seu histórico anterior será preservado.', {
      exact: true,
    }),
  ).toBeVisible();
  expect((await snapshot(page)).academicJourney.stage).toBe('FOUNDATIONS');
  await page.getByRole('button', { name: 'Confirmo minha mudança de etapa', exact: true }).click();
  await page.getByRole('button', { name: 'Salvar perfil', exact: true }).click();
  await expect.poll(async () => (await snapshot(page)).academicJourney.stage).toBe('INTERNSHIP');
  const data = await snapshot(page);
  expect(data.academicJourney.transitions).toHaveLength(2);
  expect(data.attempts).toHaveLength(0);
  await page.getByRole('button', { name: 'Minha jornada e memória', exact: true }).click();
  await expect(page.getByText('Sua jornada de aprendizagem', { exact: true })).toBeVisible();
  await expect(page.getByText('Vamos construir sua memória', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText('Internato', { exact: true }).first()).toBeVisible();
});
test('question, confidence, error and flashcard update one conceptual memory and keep historical stage', async ({
  page,
}) => {
  await page.goto('/profile-edit');
  await page.getByRole('button', { name: 'Fundamentos da graduação', exact: true }).click();
  await page.getByRole('button', { name: 'Salvar perfil', exact: true }).click();
  await page.goto('/questions?topicId=acid&questionId=q-acid-1');
  await expect(page.getByText(/Fundamentos da graduação · Explicar/)).toBeVisible();
  await page.getByRole('button', { name: 'Iniciar sessão', exact: true }).click();
  await page.getByRole('radio', { name: /^A\. Hipoventilação/ }).click();
  await page.getByRole('button', { name: 'Responder', exact: true }).click();
  await page.getByRole('button', { name: 'Tinha certeza', exact: true }).click();
  await page.getByRole('button', { name: 'Criar flashcard deste erro', exact: true }).click();
  const key = personalStorageKey;
  await expect.poll(async () => (await snapshot(page, key)).attempts.length).toBe(1);
  const before = await snapshot(page, key);
  const card = before.flashcards.find(
    (item: { sourceQuestionId?: string }) => item.sourceQuestionId === 'q-acid-1',
  );
  const conceptId = before.attempts[0].conceptId;
  const mastery = before.practice.mastery.find(
    (item: { conceptId: string }) => item.conceptId === conceptId,
  ).value;
  await page.goto('/flashcards?flashcardId=' + card.id);
  await page.getByRole('button', { name: 'Virar flashcard', exact: true }).click();
  await page.getByRole('button', { name: /^Não lembrei/ }).click();
  await expect
    .poll(
      async () =>
        (await snapshot(page, key)).learning.events.filter(
          (event: { type: string }) => event.type === 'FLASHCARD_REVIEW',
        ).length,
    )
    .toBe(1);
  const after = await snapshot(page, key);
  expect(
    after.practice.mastery.find((item: { conceptId: string }) => item.conceptId === conceptId)
      .value,
  ).toBeLessThan(mastery);
  expect(after.attempts[0].academicStage).toBe('FOUNDATIONS');
  await page.goto('/learning');
  await expect(page.getByText('Memória por conceito', { exact: true })).toBeVisible();
  await expect(page.getByText('Questão respondida', { exact: true })).toBeVisible();
  await expect(page.getByText('Flashcard revisado', { exact: true })).toBeVisible();
  await page.reload();
  expect((await snapshot(page, key)).learning.masteryHistory).toHaveLength(2);
});
test('journey and learner memory fit phone, tablet and desktop without runtime errors', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const width of [360, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of ['/profile-edit', '/learning']) {
      await page.goto(route);
      await expect(
        page.getByText(
          route === '/learning' ? 'Sua jornada de aprendizagem' : 'Seu perfil acadêmico',
          { exact: true },
        ),
      ).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    }
    await page.screenshot({ path: 'docs/screenshots/longitudinal-' + width + '.png' });
  }
  expect(errors).toEqual([]);
});
