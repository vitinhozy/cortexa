import test from 'node:test';
import assert from 'node:assert/strict';
import { LocalRepository } from '../services/repository';
import { createPersonalWorkspace } from '../services/personalWorkspace';
import { createServices } from '../services';
test('curriculum expands beyond the initial catalog and topics retain explicit hierarchy', async () => {
  const repo = new LocalRepository(() => createPersonalWorkspace('student'));
  const services = createServices(repo);
  const subject = await services.subjectService.add('Disciplina própria');
  const parent = await services.learningService.addTopic(
    subject.id,
    'Tema próprio',
    undefined,
    'theme',
  );
  const child = await services.learningService.addTopic(
    subject.id,
    'Subtópico próprio',
    parent.id,
    'subtopic',
  );
  const concept = await services.learningService.addConcept(child.id, 'Conceito próprio');
  assert.equal(child.parentTopicId, parent.id);
  assert.equal(concept.topicId, child.id);
  await assert.rejects(services.learningService.addTopic('anatomy', 'Outro assunto', parent.id));
  assert.equal(repo.getSnapshot().attempts.length, 0);
});
