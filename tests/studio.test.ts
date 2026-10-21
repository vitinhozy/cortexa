import test from 'node:test';
import assert from 'node:assert/strict';
import { createPersonalWorkspace } from '../services/personalWorkspace';
import { LocalRepository } from '../services/repository';
import { createServices } from '../services';
import { studyBlocks } from '../features/study/studio';
import { searchStudy } from '../features/study/search';

test('studio documents preserve authored text, persist, edit and delete independently of source notes', async () => {
  const values = new Map<string, string>();
  const storage = {
    async getItem(key: string) {
      return values.get(key) ?? null;
    },
    async setItem(key: string, value: string) {
      values.set(key, value);
    },
  };
  const repo = new LocalRepository(() => createPersonalWorkspace('local'), 'studio-test');
  await repo.hydrate(storage);
  const services = createServices(repo);
  const source = await services.materialService.addNote(
    'Aula',
    'Tema A\nIdeia A\n\nTema B\nIdeia B',
  );
  const document = await services.studioService.save({
    kind: 'mindmap',
    title: 'Meu mapa',
    body: source.content!,
    materialId: source.id,
  });
  assert.deepEqual(studyBlocks(document.body), [
    { title: 'Tema A', lines: ['Ideia A'] },
    { title: 'Tema B', lines: ['Ideia B'] },
  ]);
  await services.studioService.save({
    ...document,
    title: 'Mapa revisado',
    body: 'Ramo\nConteúdo revisado',
  });
  assert.equal(repo.getSnapshot().studio?.length, 1);
  assert.equal(repo.getSnapshot().materials[0].content, source.content);
  await repo.flush();
  const restored = new LocalRepository(() => createPersonalWorkspace('local'), 'studio-test');
  await restored.hydrate(storage);
  assert.equal(restored.getSnapshot().studio?.[0].title, 'Mapa revisado');
  assert.equal(
    searchStudy(restored.getSnapshot(), 'conteudo revisado', 'studio')[0]?.id,
    document.id,
  );
  assert.deepEqual(searchStudy(createPersonalWorkspace('another'), 'conteudo revisado'), []);
  await createServices(restored).studioService.remove(document.id);
  assert.equal(restored.getSnapshot().studio?.length, 0);
  assert.equal(restored.getSnapshot().materials.length, 1);
});

test('invalid studio inputs cannot mutate the workspace or change a saved document format', async () => {
  const repo = new LocalRepository(() => createPersonalWorkspace('local'));
  const service = createServices(repo).studioService;
  const before = repo.getSnapshot();
  await assert.rejects(service.save({ kind: 'slides', title: ' ', body: 'Texto' }));
  await assert.rejects(
    service.save({
      kind: 'slides',
      title: 'Slides',
      body: 'Texto',
      materialId: 'another-owner-material',
    }),
  );
  await assert.rejects(
    service.save({
      kind: 'mindmap',
      title: 'Mapa',
      body: Array.from({ length: 25 }, (_, index) => `Ramo ${index}`).join('\n\n'),
    }),
  );
  assert.equal(repo.getSnapshot(), before);
  const saved = await service.save({
    kind: 'slides',
    title: 'Slides',
    body: 'Título\nTexto literal, sem geração.',
  });
  await assert.rejects(service.save({ ...saved, kind: 'transcript' }));
  assert.equal(repo.getSnapshot().studio?.[0].body, saved.body);
});

test('authored flashcards and questions connect to real practice and reject invalid or foreign topics', async () => {
  const repo = new LocalRepository(() => createPersonalWorkspace('local'));
  const services = createServices(repo);
  await assert.rejects(services.studioService.addFlashcard('missing', 'Frente', 'Verso'));
  const note = await services.materialService.addNote('Conceitos da aula', 'Organização do tema.');
  const card = await services.studioService.addFlashcard(
    note.topicId,
    'Pergunta curta?',
    'Minha resposta.',
  );
  await services.studioService.addFlashcard(
    note.topicId,
    'Pergunta revisada?',
    'Minha resposta revisada.',
    card.id,
  );
  assert.equal(repo.getSnapshot().flashcards.length, 1);
  const question = await services.studioService.addQuestion(
    note.topicId,
    'Qual opção revisei?',
    ['Tema A', 'Tema B', 'Tema C', 'Tema D'],
    1,
    'A opção revisada foi o tema B.',
  );
  await assert.rejects(
    services.studioService.addQuestion(
      note.topicId,
      'Pergunta',
      ['Igual', 'Igual', 'C', 'D'],
      0,
      'Explicação',
    ),
  );
  assert.equal(repo.getSnapshot().questions.length, 1);
  assert.equal(question.authored, true);
  await services.questionService.answer(question.id, 'B', 'manual-attempt');
  await services.flashcardService.review(card.id, 'good');
  assert.equal(repo.getSnapshot().attempts[0].correct, true);
  assert.equal(repo.getSnapshot().reviews[0].flashcardId, card.id);
  assert.equal(repo.getSnapshot().user.answered, 1);
  assert.equal(repo.getSnapshot().conversations.length, 0);
});

test('malformed stored studio content is preserved without overwriting the snapshot', async () => {
  const raw = JSON.stringify({
    ...createPersonalWorkspace('local'),
    studio: [{ id: 'bad', kind: 'slides', body: 123 }],
  });
  let writes = 0;
  const repo = new LocalRepository(() => createPersonalWorkspace('local'));
  await repo.hydrate({
    async getItem() {
      return raw;
    },
    async setItem() {
      writes++;
    },
  });
  assert.equal(repo.storageError, true);
  repo.update((data) => ({ ...data, studio: [] }));
  await repo.flush();
  assert.equal(writes, 0);
});
