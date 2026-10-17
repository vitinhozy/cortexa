import { test, expect } from '@playwright/test';
test('tab navigation and completing a correct question session', async ({ page }) => {
  await page.goto('/');
  for (const tab of ['Estudar', 'Biblioteca', 'IA', 'Perfil', 'Início']) {
    await page.getByRole('tab', { name: tab, exact: true }).click();
    await expect(page.getByRole('tab', { name: tab, exact: true })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  }
  await page.goto('/questions?topicId=raas');
  await page.getByRole('radio', { name: 'B. Renina', exact: true }).click();
  await page.getByRole('button', { name: 'Responder', exact: true }).click();
  await expect(page.getByText('Isso mesmo. Conceito consolidado!')).toBeVisible();
  await page.getByRole('button', { name: 'Ver resultado', exact: true }).click();
  await expect(page.getByText('1/1', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Revisar meus erros', exact: true }).click();
  await expect(page.getByText('1 oportunidades de revisão')).toBeVisible();
});
test('wrong answer → mistake → flashcard → persisted knowledge', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByText(/Boa (noite|tarde), Victor|Bom dia, Victor/)).toBeVisible();
  await page.getByRole('button', { name: 'Começar estudo', exact: true }).click();
  await page.getByRole('button', { name: 'Praticar questões', exact: true }).click();
  await page.getByRole('radio', { name: /^A\. Hipoventilação/ }).click();
  await page.getByRole('button', { name: 'Responder', exact: true }).click();
  await expect(page.getByText('Alternativa correta: B')).toBeVisible();
  await page.getByRole('button', { name: 'Criar flashcard deste erro', exact: true }).click();
  await expect(
    page.getByText('Flashcard salvo! Ele já está disponível na sua revisão.'),
  ).toBeVisible();
  await page.goto('/mistakes');
  await expect(page.getByText('2 oportunidades de revisão')).toBeVisible();
  await page.goto('/knowledge');
  await expect(page.getByRole('button', { name: 'Equilíbrio ácido-base, 38%' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Equilíbrio ácido-base, 38%' })).toBeVisible();
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
test('library notes, material chat, mode switching and guided tutor', async ({ page }) => {
  await page.goto('/library');
  await page.getByRole('button', { name: 'Adicionar material', exact: true }).click();
  await page.getByRole('textbox', { name: 'Título', exact: true }).fill('Revisão demonstrativa');
  await page
    .getByRole('textbox', { name: 'Anotação', exact: true })
    .fill('O bicarbonato diminui na acidose metabólica.');
  await page.getByRole('button', { name: 'Salvar anotação', exact: true }).click();
  await expect(page.getByText('Sua anotação', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Conversar com material', exact: true }).click();
  await expect(page.getByText(/Contexto selecionado: Revisão demonstrativa/)).toBeVisible();
  await page
    .getByRole('textbox', { name: 'Sua pergunta', exact: true })
    .fill('Explique equilíbrio ácido-base');
  await page.getByRole('button', { name: 'Enviar pergunta', exact: true }).click();
  await expect(page.getByText('TUTOR IA · DEMONSTRAÇÃO', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Modo medicina', exact: true }).click();
  await expect(page.getByText('Baseado em referências médicas · SIMULADO')).toBeVisible();
  await page.getByRole('button', { name: 'Me ensine · aula guiada', exact: true }).click();
  await page.getByRole('button', { name: 'Ele aumenta', exact: true }).click();
  await expect(page.getByText(/Pense no bicarbonato como uma base/)).toBeVisible();
  await page.getByRole('button', { name: 'Continuar raciocínio', exact: true }).click();
  await page.getByRole('button', { name: 'Aumentar a ventilação', exact: true }).click();
  await page.getByRole('button', { name: 'Continuar raciocínio', exact: true }).click();
  await page
    .getByRole('button', { name: 'Não; pode ser a compensação esperada', exact: true })
    .click();
  await page.getByRole('button', { name: 'Concluir aula', exact: true }).click();
  await expect(page.getByText('Você conectou as peças.')).toBeVisible();
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
test('tabs and responsive home render without overflow or console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  for (const route of [
    '/',
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
    await expect(page.getByText('DEMONSTRAÇÃO', { exact: true })).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  }
  await page.goto('/');
  await page.screenshot({ path: 'docs/screenshots/home-mobile.png', fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page.screenshot({ path: 'docs/screenshots/home-desktop.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  expect(errors).toEqual([]);
});
