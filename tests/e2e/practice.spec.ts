import { expect, test, type Page } from '@playwright/test';
import { demonstrationStorage, ensurePersonalWorkspace } from './workspace-helpers';

test.use({ storageState: demonstrationStorage });

async function snapshot(page: Page, key = 'cortexa:demo:v1') {
  return page.evaluate((storageKey) => JSON.parse(localStorage.getItem(storageKey) ?? '{}'), key);
}
async function answer(page: Page, option = 0, confidence = 'Tinha certeza') {
  await page.getByRole('radio').nth(option).click();
  await page.getByRole('button', { name: 'Responder', exact: true }).click();
  await page.getByRole('button', { name: confidence, exact: true }).click();
}

test('practice home opens without the resume panel or large mode buttons', async ({ page }) => {
  await page.goto('/questions');
  await expect(page.getByText('Continue de onde parou.', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Questões', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Simulado', exact: true })).toHaveCount(0);
  await expect(
    page.getByText('Escolha um assunto ou material para iniciar uma prática no seu ritmo.'),
  ).toBeVisible();
});

test('material picker groups source types and preserves selections across search and collapse', async ({
  page,
}) => {
  await page.goto('/ai?topicId=acid');
  await page
    .getByRole('textbox', { name: 'Sua pergunta', exact: true })
    .fill('Resumo de ácido-base');
  await page.getByRole('button', { name: 'Enviar pergunta', exact: true }).click();
  await expect.poll(async () => (await snapshot(page)).conversations[0]?.messages.length).toBe(2);
  await page.goto('/questions');
  await page.getByRole('button', { name: 'Usar meus materiais', exact: true }).click();
  const picker = page.getByRole('dialog', { name: 'Escolha seus materiais.', exact: true });
  await expect(picker).toBeVisible();
  await expect(
    picker.getByRole('button', { name: 'Materiais e anotações', exact: true }),
  ).toBeVisible();
  await expect(picker.getByRole('button', { name: 'Flashcards', exact: true })).toBeVisible();
  await expect(
    picker.getByRole('button', { name: 'Conversas com a IA', exact: true }),
  ).toBeVisible();
  await expect(picker.getByRole('checkbox')).toHaveCount(0);
  for (const width of [360, 768, 1376]) {
    await page.setViewportSize({ width, height: 900 });
    const block = await picker.getByTestId('practice-source-group-flashcard').boundingBox();
    expect(block).not.toBeNull();
    expect(block!.x).toBeGreaterThanOrEqual(0);
    expect(block!.x + block!.width).toBeLessThanOrEqual(width);
  }

  const flashcards = picker.getByTestId('practice-source-group-flashcard');
  await flashcards.getByRole('button', { name: 'Flashcards', exact: true }).click();
  await flashcards.getByRole('checkbox').first().check();
  await flashcards.getByRole('button', { name: 'Flashcards', exact: true }).click();
  await expect(flashcards.getByRole('checkbox')).toHaveCount(0);
  await expect(flashcards.getByText(/1 selecionado/)).toBeVisible();

  await picker.getByRole('button', { name: 'Conversas com a IA', exact: true }).click();
  const chat = picker.getByRole('checkbox', {
    name: 'Selecionar Resumo de ácido-base',
    exact: true,
  });
  await chat.check();
  await expect(picker.getByRole('button', { name: 'Usar 2 conteúdos', exact: true })).toBeEnabled();
  const search = picker.getByRole('textbox', { name: 'Buscar nos meus materiais', exact: true });
  await search.fill('resumo');
  await expect(chat).toBeChecked();
  await expect(flashcards).toHaveCount(0);
  await search.fill('nenhum-conteudo-encontravel');
  await expect(picker.getByText('Nenhum conteúdo encontrado', { exact: true })).toBeVisible();
  await expect(picker.getByRole('button', { name: 'Usar 2 conteúdos', exact: true })).toBeEnabled();
  await search.fill('flashcards');
  await expect(flashcards.getByRole('checkbox').first()).toBeChecked();
  await search.fill('');
  await expect(
    picker.getByRole('button', { name: 'Conversas com a IA', exact: true }),
  ).toBeVisible();
  await picker.getByRole('button', { name: 'Usar 2 conteúdos', exact: true }).click();
  await expect(
    page.getByRole('dialog', { name: 'Escolha os conceitos.', exact: true }),
  ).toBeVisible();
});

test('questions starts with preparation and confidence survives interruption before feedback', async ({
  page,
}) => {
  await page.goto('/study');
  await page.getByRole('button', { name: 'Questões', exact: true }).click();
  await expect(page.getByText('O que você quer praticar hoje?', { exact: true })).toBeVisible();
  await expect(page.getByRole('radio')).toHaveCount(0);
  await page.goto('/questions?topicId=acid&questionId=q-acid-1');
  await expect(page.getByText('Monte sua sessão.', { exact: true })).toBeVisible();
  await expect(page.getByRole('dialog', { name: 'Monte sua sessão.', exact: true })).toBeVisible();
  await expect(page.getByRole('radio')).toHaveCount(0);
  await page.getByRole('button', { name: 'Iniciar sessão', exact: true }).click();
  await expect(page).toHaveURL(/\/practice\//);
  await expect(page.getByRole('dialog', { name: 'Monte sua sessão.', exact: true })).toHaveCount(0);
  await page.getByRole('radio', { name: /^A\. Hipoventilação/ }).click();
  await page.getByRole('button', { name: 'Responder', exact: true }).click();
  await expect(page.getByText('Quão seguro você estava?', { exact: true })).toBeVisible();
  await expect(page.getByText('Alternativa correta: B', { exact: true })).toHaveCount(0);
  await expect
    .poll(async () => (await snapshot(page)).practice?.sessions[0]?.items[0]?.locked)
    .toBe(true);
  await page.reload();
  await expect(page.getByText('Quão seguro você estava?', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Tinha certeza', exact: true }).click();
  await expect(page.getByText('Alternativa correta: B', { exact: true })).toBeVisible();
  await expect(page.getByText(/Você respondeu com bastante confiança/)).toBeVisible();
  await page.getByRole('button', { name: 'Revisar conceito', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Revisar conceito', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Voltar à questão', exact: true }).click();
  await page.getByRole('button', { name: 'Ver resultado', exact: true }).click();
  await expect(page.getByText('Sessão concluída.', { exact: true })).toBeVisible();
  await expect(page.getByText('Você precisa revisar', { exact: true })).toBeVisible();
  await expect.poll(async () => (await snapshot(page)).attempts.length).toBe(1);
  await page.getByRole('button', { name: 'Revisar meus erros', exact: true }).click();
  await expect(
    page.getByText('Compensação respiratória', { exact: true }).filter({ visible: true }).first(),
  ).toBeVisible();
  await expect(page.getByText(/último erro foi respondido com alta confiança/)).toBeVisible();
  await page.getByRole('button', { name: 'Praticar novamente', exact: true }).click();
  await expect(page.getByText('Monte sua sessão.', { exact: true })).toBeVisible();
  await expect(page.getByRole('radio')).toHaveCount(0);
});

test('exam keeps feedback hidden, persists navigation and flags, and grades only once at submission', async ({
  page,
}) => {
  await page.goto('/questions?kind=exam&topicId=acid');
  await page.getByRole('textbox', { name: 'Tempo em minutos (opcional)', exact: true }).fill('1');
  await page.getByRole('button', { name: 'Iniciar simulado', exact: true }).click();
  await page.getByRole('radio').first().click();
  await page.getByRole('button', { name: 'Marcar para revisar', exact: true }).click();
  await page.getByRole('button', { name: 'Próxima', exact: true }).click();
  await page.getByRole('radio').nth(1).click();
  await page.getByRole('button', { name: 'Anterior', exact: true }).click();
  await expect(page.getByRole('radio').first()).toBeChecked();
  await expect(page.getByText(/Alternativa correta:/)).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Responder', exact: true })).toHaveCount(0);
  await expect.poll(async () => (await snapshot(page)).attempts.length).toBe(0);
  await page.getByRole('button', { name: 'Pausar e sair', exact: true }).click();
  await page.reload();
  await page.getByRole('button', { name: 'Retomar sessão', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Marcada para revisar', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('radio').first()).toBeChecked();
  await page.getByRole('button', { name: 'Revisar marcações', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Questão 1 · marcada · respondida', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Voltar ao simulado', exact: true }).click();
  await page.getByRole('button', { name: 'Finalizar simulado', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Entregar simulado?', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Entregar e ver análise', exact: true }).click();
  await expect(page.getByText('Simulado concluído.', { exact: true })).toBeVisible();
  await expect.poll(async () => (await snapshot(page)).attempts.length).toBe(2);
  await page.reload();
  await expect(page.getByText('Simulado concluído.', { exact: true })).toBeVisible();
  expect((await snapshot(page)).attempts.length).toBe(2);
  await page.getByRole('button', { name: 'Revisar minhas respostas', exact: true }).click();
  await expect(page.getByText(/Alternativa correta:/).first()).toBeVisible();
});

test('personal text and authored questions stay grounded in their source without invented generation', async ({
  page,
}) => {
  await ensurePersonalWorkspace(page);
  await page.goto('/questions');
  await expect(page.getByText('Seu próximo estudo começa aqui', { exact: true })).toBeVisible();
  await expect(page.getByRole('radio')).toHaveCount(0);
  await page.getByRole('button', { name: 'Adicionar novo material', exact: true }).click();
  await expect(
    page.getByRole('dialog', { name: 'Traga um novo conteúdo.', exact: true }),
  ).toBeVisible();
  await expect(page.getByText('Seu próximo estudo começa aqui', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'PDF', exact: true }).click();
  await expect(
    page.getByText(/Upload, OCR e transcrição ainda não estão conectados/),
  ).toBeVisible();
  await page
    .getByRole('textbox', { name: 'Título do conteúdo', exact: true })
    .fill('Rascunho pessoal de estudo');
  await page
    .getByRole('textbox', { name: 'Texto ou anotação', exact: true })
    .fill('Meu texto diz que a próxima ação é revisar os conceitos da aula.');
  await page.getByRole('button', { name: 'Salvar e escolher conteúdo', exact: true }).click();
  await expect(
    page.getByText('Seu conteúdo está salvo. Falta o banco de questões.', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('dialog', { name: 'Escolha os conceitos.', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Voltar para etapa anterior', exact: true }).click();
  await expect(
    page.getByRole('dialog', { name: 'Traga um novo conteúdo.', exact: true }),
  ).toBeVisible();
  await page
    .getByRole('textbox', { name: 'Título do conteúdo', exact: true })
    .fill('Anotação pessoal de estudo');
  await page
    .getByRole('textbox', { name: 'Texto ou anotação', exact: true })
    .fill('O conteúdo pessoal está conectado à questão que vou criar.');
  await page.getByRole('button', { name: 'Salvar e escolher conteúdo', exact: true }).click();
  await expect
    .poll(async () => (await snapshot(page, 'cortexa:personal:local:v1')).materials.length)
    .toBe(2);
  await page.getByRole('button', { name: 'Criar questão com esta fonte', exact: true }).click();
  await page
    .getByRole('textbox', { name: 'Conceito ou subtópico (opcional)', exact: true })
    .fill('Meu próximo passo');
  await page
    .getByRole('textbox', { name: 'Enunciado', exact: true })
    .fill('Segundo minha anotação, qual é a próxima ação?');
  for (const [index, text] of [
    'Revisar os conceitos da aula',
    'Apagar a anotação',
    'Trocar de curso',
    'Interromper os estudos',
  ].entries())
    await page
      .getByRole('textbox', { name: `Alternativa ${'ABCD'[index]}`, exact: true })
      .fill(text);
  await page
    .getByRole('textbox', { name: 'Explicação da resposta', exact: true })
    .fill('Essa é a ação escrita literalmente na minha anotação.');
  await page.getByRole('button', { name: 'Salvar questão', exact: true }).click();
  await page.getByRole('button', { name: 'Iniciar sessão', exact: true }).click();
  await answer(page, 0, 'Chutei');
  await expect(page.getByText('Você acertou.', { exact: true })).toBeVisible();
  await expect(page.getByText(/Você acertou e informou que chutou/)).toBeVisible();
  await expect(page.getByText('Do seu material', { exact: true })).toBeVisible();
  await expect(
    page.getByText('Anotação pessoal de estudo', { exact: true }).filter({ visible: true }).first(),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByText('Você acertou.', { exact: true })).toBeVisible();
  const personal = await snapshot(page, 'cortexa:personal:local:v1');
  expect(personal.questions).toHaveLength(1);
  expect(personal.questions[0].authored).toBe(true);
  expect(personal.attempts[0].confidence).toBe('guess');
  await page.getByRole('button', { name: 'Ver resultado', exact: true }).click();
  await page.getByRole('button', { name: 'Encerrar', exact: true }).click();
  await page.getByRole('button', { name: 'Usar meus materiais', exact: true }).click();
  await page.getByRole('button', { name: 'Materiais e anotações', exact: true }).click();
  await page
    .getByRole('checkbox', { name: 'Selecionar Anotação pessoal de estudo', exact: true })
    .click();
  await page.getByRole('button', { name: 'Usar 1 conteúdo', exact: true }).click();
  await expect(
    page.getByText('Conceitos disponíveis para praticar', { exact: true }),
  ).toBeVisible();
  await expect(page.getByText('Meu próximo passo', { exact: true }).first()).toBeVisible();
});

test('diagnostic covers varied concepts and explains its provisional estimates', async ({
  page,
}) => {
  await page.goto('/questions');
  await page.getByRole('button', { name: 'Diagnóstico rápido', exact: true }).click();
  await page.getByRole('button', { name: 'Escolher Equilíbrio ácido-base', exact: true }).click();
  await page.getByRole('button', { name: 'Configurar sessão', exact: true }).click();
  await page.getByRole('button', { name: 'Começar diagnóstico', exact: true }).click();
  for (let index = 0; index < 5; index++) {
    await answer(page);
    await page
      .getByRole('button', { name: index === 4 ? 'Ver resultado' : 'Próxima questão', exact: true })
      .click();
    if (index < 4)
      expect((await page.getByTestId('practice-prompt').boundingBox())?.y).toBeLessThan(500);
  }
  await expect(page.getByText('Seu ponto de partida.', { exact: true })).toBeVisible();
  await expect(
    page.getByText('Um primeiro retrato, sem nota ou julgamento.', { exact: true }),
  ).toBeVisible();
  await expect
    .poll(async () => (await snapshot(page)).practice?.sessions[0]?.status)
    .toBe('completed');
  const state = await snapshot(page);
  expect(
    new Set(state.attempts.map((attempt: { conceptId: string }) => attempt.conceptId)).size,
  ).toBe(5);
  await expect(
    page.getByText(/Estimativa inicial; precisamos de mais tentativas/).first(),
  ).toBeVisible();
});

test('preparation and reading fit phone, iPad and desktop without runtime errors', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/questions');
  for (const width of [360, 768, 1376]) {
    await page.setViewportSize({ width, height: 1032 });
    await expect(page.getByText('O que você quer praticar hoje?', { exact: true })).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await page.screenshot({ path: `docs/screenshots/practice-preparation-${width}.png` });
  }
  await page.goto('/study');
  await page.getByRole('button', { name: 'Mover navegação à esquerda', exact: true }).click();
  await page.getByRole('button', { name: 'Questões', exact: true }).click();
  await page.setViewportSize({ width: 768, height: 1032 });
  await page.getByRole('button', { name: 'Praticar Equilíbrio ácido-base', exact: true }).click();
  await expect(
    page.getByRole('dialog', { name: 'Escolha os conceitos.', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Configurar sessão', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Monte sua sessão.', exact: true })).toBeVisible();
  await page.screenshot({ path: 'docs/screenshots/practice-config-ipad.png' });
  await page.getByRole('button', { name: 'Iniciar sessão', exact: true }).click();
  for (const width of [360, 768, 1376]) {
    await page.setViewportSize({ width, height: 1032 });
    await expect(page.getByRole('radio').first()).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await page.screenshot({ path: `docs/screenshots/practice-reading-${width}.png` });
  }
  expect(errors).toEqual([]);
});

test('manual subject search finds concepts in existing content and handles new subjects honestly', async ({
  page,
}) => {
  await page.goto('/questions');
  await page.getByRole('button', { name: 'Escolher assunto', exact: true }).click();
  const search = page.getByRole('textbox', { name: 'O que você quer estudar?', exact: true });
  await search.fill('acidose metabolica');
  await expect(
    page.getByRole('button', { name: 'Escolher Equilíbrio ácido-base', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Escolher Equilíbrio ácido-base', exact: true }).click();
  await expect(page.getByText('Escolha os conceitos.', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('dialog', { name: 'Escolha os conceitos.', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Voltar para etapa anterior', exact: true }).click();
  await expect(
    page.getByRole('dialog', { name: 'O que você quer estudar?', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Escolher Equilíbrio ácido-base', exact: true }).click();
  await page.getByRole('button', { name: 'Configurar sessão', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Monte sua sessão.', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Voltar para etapa anterior', exact: true }).click();
  await expect(
    page.getByRole('dialog', { name: 'Escolha os conceitos.', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Voltar para etapa anterior', exact: true }).click();
  await expect(
    page.getByRole('dialog', { name: 'O que você quer estudar?', exact: true }),
  ).toBeVisible();
  await expect(search).toHaveValue('acidose metabolica');
  await search.fill('Assunto novo sem banco');
  await expect(
    page.getByText('Ainda não há questões para esse assunto', { exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Adicionar conteúdo: Assunto novo sem banco', exact: true })
    .click();
  await expect(page.getByRole('textbox', { name: 'Título do conteúdo', exact: true })).toHaveValue(
    'Assunto novo sem banco',
  );
});
