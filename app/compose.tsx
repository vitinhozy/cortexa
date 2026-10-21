import { useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Card, Empty, Field, Notice, Screen, T, s } from '@/components/ui';
import { Choice, Choices } from '@/components/Choice';
import { useStudy } from '@/hooks/useStudy';
import { colors } from '@/constants/theme';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { studySources } from '@/features/study/practice';
import { conceptCatalog } from '@/features/study/concepts';

export default function ComposeScreen() {
  const { replace } = useAppNavigation();
  const {
    kind,
    materialId,
    sourceId,
    topicId: routeTopicId,
  } = useLocalSearchParams<{
    kind?: string;
    materialId?: string;
    sourceId?: string;
    topicId?: string;
  }>();
  const assessment = kind === 'assessment';
  const { data, services, repository } = useStudy();
  const source = data.materials.find((item) => item.id === materialId);
  const [topicId, setTopicId] = useState(
    source?.topicId ?? routeTopicId ?? data.topics[0]?.id ?? '',
  );
  const [sourceIds, setSourceIds] = useState<string[]>(
    sourceId ? [sourceId] : materialId ? [`material:${materialId}`] : [],
  );
  const [conceptName, setConceptName] = useState('');
  const [conceptId, setConceptId] = useState<string>();
  const [difficulty, setDifficulty] = useState<'Fácil' | 'Média' | 'Difícil'>('Média');
  const availableSources = studySources(data).filter(
    (item) => !item.topicIds.length || item.topicIds.includes(topicId),
  );
  const [prompt, setPrompt] = useState('');
  const [answer, setAnswer] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correct, setCorrect] = useState(0);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const created = useRef<string | undefined>(undefined);
  return (
    <Screen
      title={assessment ? 'Uma questão feita por você.' : 'Uma ideia para lembrar.'}
      subtitle="Escreva com suas palavras. Revise o conteúdo antes de praticar."
      eyebrow={assessment ? 'CRIAR QUESTÃO' : 'CRIAR FLASHCARD'}
      back
      backTo={assessment ? '/questions' : '/flashcards'}
    >
      {!data.topics.length ? (
        <>
          <Empty
            title="Comece por um assunto"
            message="Salve uma anotação na biblioteca para criar um assunto e vincular seus cartões e questões."
          />
          <Button title="Criar anotação" onPress={() => router.push('/material/add')} />
        </>
      ) : (
        <>
          <Card style={{ backgroundColor: assessment ? colors.peach : colors.amberLight }}>
            <T style={s.sectionTitle}>Assunto do seu material</T>
            <Choices>
              {data.topics.map((topic) => (
                <Choice
                  key={topic.id}
                  label={topic.name}
                  selected={topicId === topic.id}
                  onPress={() => {
                    setTopicId(topic.id);
                    setSourceIds([]);
                    setConceptId(undefined);
                  }}
                />
              ))}
            </Choices>
          </Card>
          {conceptCatalog(data).some((c) => c.topicId === topicId) ? (
            <Card>
              <T style={s.sectionTitle}>Vincular a um conceito (opcional)</T>
              <Choices>
                <Choice
                  label="Assunto geral"
                  selected={!conceptId}
                  onPress={() => setConceptId(undefined)}
                />
                {conceptCatalog(data)
                  .filter((c) => c.topicId === topicId)
                  .map((c) => (
                    <Choice
                      key={c.id}
                      label={c.name}
                      selected={conceptId === c.id}
                      onPress={() => setConceptId(c.id)}
                    />
                  ))}
              </Choices>
            </Card>
          ) : null}
          {assessment ? (
            <Card>
              <Field
                label="Conceito ou subtópico (opcional)"
                value={conceptName}
                onChangeText={setConceptName}
                maxLength={100}
                placeholder="Ex.: Compensação respiratória"
              />
              <T style={s.sectionTitle}>Dificuldade</T>
              <Choices>
                {(['Fácil', 'Média', 'Difícil'] as const).map((value) => (
                  <Choice
                    key={value}
                    label={value}
                    selected={difficulty === value}
                    onPress={() => setDifficulty(value)}
                  />
                ))}
              </Choices>
              {availableSources.length ? (
                <>
                  <T style={s.sectionTitle}>Baseado em (opcional)</T>
                  <T muted style={{ fontSize: 12 }}>
                    Vincule o conteúdo que você utilizou para escrever a questão.
                  </T>
                  <Choices>
                    {availableSources.map((item) => (
                      <Choice
                        key={item.id}
                        label={item.title.slice(0, 70)}
                        selected={sourceIds.includes(item.id)}
                        onPress={() =>
                          setSourceIds((previous) =>
                            previous.includes(item.id)
                              ? previous.filter((value) => value !== item.id)
                              : [...previous, item.id],
                          )
                        }
                      />
                    ))}
                  </Choices>
                </>
              ) : null}
            </Card>
          ) : null}
          <Card>
            <Field
              label={assessment ? 'Enunciado' : 'Frente do flashcard'}
              value={prompt}
              onChangeText={setPrompt}
              multiline
              maxLength={assessment ? 1000 : 500}
              placeholder={
                assessment ? 'Qual conceito você quer testar?' : 'Escreva uma pergunta curta'
              }
            />
            {assessment
              ? options.map((value, index) => (
                  <Field
                    key={index}
                    label={`Alternativa ${'ABCD'[index]}`}
                    value={value}
                    onChangeText={(text) =>
                      setOptions((previous) =>
                        previous.map((item, position) => (position === index ? text : item)),
                      )
                    }
                    maxLength={300}
                  />
                ))
              : null}
            {assessment ? (
              <>
                <T style={s.sectionTitle}>Alternativa correta</T>
                <Choices>
                  {options.map((_, index) => (
                    <Choice
                      key={index}
                      label={`Resposta ${'ABCD'[index]}`}
                      selected={correct === index}
                      onPress={() => setCorrect(index)}
                    />
                  ))}
                </Choices>
              </>
            ) : null}
            <Field
              label={assessment ? 'Explicação da resposta' : 'Verso do flashcard'}
              value={answer}
              onChangeText={setAnswer}
              multiline
              maxLength={3000}
              placeholder="A explicação que você quer revisar depois"
            />
          </Card>
          <Notice text="Conteúdo cadastrado por você. O app não verifica a correção médica nem gera estas respostas por IA." />
          {error ? <Notice text={error} /> : null}
          <Button
            title={busy ? 'Salvando...' : assessment ? 'Salvar questão' : 'Salvar flashcard'}
            icon="check"
            disabled={busy}
            onPress={async () => {
              if (lock.current) return;
              lock.current = true;
              setBusy(true);
              setError('');
              try {
                const item = assessment
                  ? await services.studioService.addQuestion(
                      topicId,
                      prompt,
                      options,
                      correct,
                      answer,
                      created.current,
                      { sourceIds, conceptName, difficulty, conceptId },
                    )
                  : await services.studioService.addFlashcard(
                      topicId,
                      prompt,
                      answer,
                      created.current,
                      { sourceIds, conceptId },
                    );
                created.current = item.id;
                await repository.flush();
                if (repository.storageError)
                  throw new Error(
                    'Conteúdo disponível nesta sessão, mas não foi possível gravar no dispositivo.',
                  );
                replace({
                  pathname: assessment ? '/questions' : '/flashcards',
                  params: {
                    topicId,
                    ...(assessment
                      ? { questionId: created.current }
                      : { flashcardId: created.current }),
                  },
                });
              } catch (reason) {
                setError(reason instanceof Error ? reason.message : 'Não foi possível salvar.');
              } finally {
                lock.current = false;
                setBusy(false);
              }
            }}
          />
        </>
      )}
    </Screen>
  );
}
