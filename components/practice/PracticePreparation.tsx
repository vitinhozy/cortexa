import { PracticeHome } from './PracticeHome';
import { PracticeSettings } from './PracticeSettings';
import { PracticeSourcePicker } from './PracticeSourcePicker';
import { useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { router } from 'expo-router';
import { Screen, Card, T, Icon, Button, Field, Notice, Empty, Progress, s } from '@/components/ui';
import { BottomSheet } from '@/components/BottomSheet';
import { Choice, Choices } from '@/components/Choice';
import { useStudy } from '@/hooks/useStudy';
import { colors, fonts } from '@/constants/theme';
import {
  estimateConceptMastery,
  studySources,
  searchPracticeTopics,
} from '@/features/study/practice';
import type { PracticeAnalysis, PracticeConfig } from '@/types/practice';

type Stage = 'home' | 'sources' | 'manual' | 'new' | 'topics' | 'config';
type StageSnapshot = { stage: Stage; query: string };
const initialConfig = (kind?: string, topicId?: string, questionId?: string): PracticeConfig => ({
  topicIds: topicId ? [topicId] : [],
  conceptIds: [],
  sourceIds: [],
  mode: kind === 'exam' ? 'exam' : kind === 'review' ? 'review' : 'learn',
  difficulty: 'adaptive',
  count: questionId ? 1 : 5,
  interleaved: true,
  style: kind === 'cases' ? 'clinical' : 'mixed',
  preferredQuestionId: questionId,
});

export function PracticePreparation({
  topicId,
  kind,
  questionId,
  conceptIds,
  sourceId,
}: {
  topicId?: string;
  kind?: string;
  questionId?: string;
  conceptIds?: string;
  sourceId?: string;
}) {
  const { data, services, repository } = useStudy();
  const [stage, setStage] = useState<Stage>(topicId || questionId ? 'config' : 'home');
  const [config, setConfig] = useState<PracticeConfig>(() => ({
    ...initialConfig(
      kind,
      topicId ?? data.questions.find((question) => question.id === questionId)?.topicId,
      questionId,
    ),
    conceptIds: conceptIds?.split(',').filter(Boolean) ?? [],
    sourceIds: sourceId ? [sourceId] : [],
  }));
  const [analysis, setAnalysis] = useState<PracticeAnalysis>();
  const [query, setQuery] = useState('');
  const [sourceIds, setSourceIds] = useState<string[]>(sourceId ? [sourceId] : []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [fileInfo, setFileInfo] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [subjectId, setSubjectId] = useState(
    data.user.subjectIds?.[0] ?? data.subjects[0]?.id ?? '',
  );
  const [customCount, setCustomCount] = useState(false);
  const [quantity, setQuantity] = useState(String(config.count));
  const [timer, setTimer] = useState('');
  const lock = useRef(false);
  const savedNote = useRef<string | undefined>(undefined);
  const navigationAfterDismiss = useRef<(() => void) | undefined>(undefined);
  const [history, setHistory] = useState<StageSnapshot[]>([]);
  const sources = studySources(data);
  const matchingTopics = searchPracticeTopics(data, query);
  const go = (next: Stage) => {
    setHistory((previous) => [...previous, { stage, query }]);
    setStage(next);
    setError('');
    setQuery('');
  };
  const backStage = () => {
    navigationAfterDismiss.current = undefined;
    const previous = history.at(-1) ?? { stage: 'home' as const, query: '' };
    setHistory((current) => current.slice(0, -1));
    setStage(previous.stage);
    setQuery(previous.query);
    setError('');
  };
  function update(patch: Partial<PracticeConfig>) {
    setConfig((previous) => ({ ...previous, ...patch }));
  }
  async function chooseTopics(
    topicIds: string[],
    selectedSources: string[] = [],
    selectedConcepts: string[] = [],
    selectedMode = config.mode,
  ) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    const next = {
      ...config,
      topicIds,
      sourceIds: selectedSources,
      conceptIds: [],
      mode: selectedMode,
    };
    try {
      const result = await services.practiceService.analyze(next);
      setAnalysis(result);
      setConfig({
        ...next,
        conceptIds: selectedConcepts.length
          ? selectedConcepts
          : result.concepts.map((concept) => concept.id),
      });
      go('topics');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível preparar o conteúdo.');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function start() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      const count = Number(quantity);
      const session = await services.practiceService.create({
        ...config,
        count,
        timeLimitSeconds: config.mode === 'exam' && timer.trim() ? Number(timer) * 60 : undefined,
      });
      await repository.flush();
      if (repository.storageError)
        throw new Error(
          'A sessão foi criada, mas houve falha ao salvar. Retome-a pelo início desta área antes de fechar o app.',
        );
      navigationAfterDismiss.current = () =>
        router.push({ pathname: '/practice/[id]', params: { id: session.id } });
      setHistory([]);
      setStage('home');
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Não foi possível criar a sessão. Tente novamente.',
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  function authorQuestion() {
    const material = config.sourceIds.find((id) => id.startsWith('material:'));
    const destination = {
      pathname: '/compose',
      params: {
        kind: 'assessment',
        materialId: material?.slice(9),
        sourceId: config.sourceIds[0],
        topicId: config.topicIds[0],
      },
    } as const;
    if (stage === 'home') router.push(destination);
    else {
      navigationAfterDismiss.current = () => router.push(destination);
      setHistory([]);
      setStage('home');
    }
  }
  const titles: Record<Stage, string> = {
    home: 'O que você quer praticar hoje?',
    sources: 'Escolha seus materiais.',
    manual: 'O que você quer estudar?',
    new: 'Traga um novo conteúdo.',
    topics: 'Escolha os conceitos.',
    config: 'Monte sua sessão.',
  };
  const subtitles: Record<Stage, string> = {
    home: 'Escolha um assunto ou material para iniciar uma prática no seu ritmo.',
    sources: 'Selecione um ou mais conteúdos do seu espaço.',
    manual: 'Encontre um assunto da sua biblioteca ou adicione um novo conteúdo.',
    new: 'Salve seu texto e confira o conteúdo antes de montar a prática.',
    topics: 'Selecione o que quer recuperar da memória nesta sessão.',
    config: 'Poucas escolhas para praticar no seu ritmo.',
  };
  return (
    <Screen
      title={titles.home}
      subtitle={subtitles.home}
      eyebrow={config.mode === 'exam' ? 'SIMULADOS' : 'PRÁTICA'}
      back
      backTo="/study"
    >
      <View style={{ width: '100%', maxWidth: 900, alignSelf: 'center', gap: 24 }}>
        <PracticeHome
          update={update}
          busy={busy}
          chooseTopics={chooseTopics}
          go={go}
          authorQuestion={authorQuestion}
          setQuantity={setQuantity}
        />
      </View>
      <BottomSheet
        visible={stage !== 'home'}
        title={titles[stage]}
        size="large"
        onBack={backStage}
        backLabel="Voltar para etapa anterior"
        onDismiss={() => {
          const navigate = navigationAfterDismiss.current;
          if (!navigate) return;
          navigationAfterDismiss.current = undefined;
          navigate();
        }}
        onClose={() => {
          navigationAfterDismiss.current = undefined;
          setHistory([]);
          setStage('home');
          setError('');
        }}
      >
        <View style={{ width: '100%', maxWidth: 900, alignSelf: 'center', gap: 20 }}>
          {busy ? (
            <View accessibilityLiveRegion="polite" style={[s.row, { gap: 10 }]}>
              <ActivityIndicator color={colors.primary} />
              <T muted>Preparando sua sessão...</T>
            </View>
          ) : null}
          {error ? <Notice text={error} /> : null}
          <T muted>{subtitles[stage]}</T>
          {stage === 'sources' ? (
            <>
              <PracticeSourcePicker
                sources={sources}
                query={query}
                onQueryChange={setQuery}
                selectedIds={sourceIds}
                onToggle={(sourceId) =>
                  setSourceIds((previous) =>
                    previous.includes(sourceId)
                      ? previous.filter((id) => id !== sourceId)
                      : [...previous, sourceId],
                  )
                }
              />
              <Button
                title={`Usar ${sourceIds.length} ${sourceIds.length === 1 ? 'conteúdo' : 'conteúdos'}`}
                disabled={!sourceIds.length || busy}
                onPress={() =>
                  void chooseTopics(
                    [
                      ...new Set(
                        sources
                          .filter((source) => sourceIds.includes(source.id))
                          .flatMap((source) => source.topicIds),
                      ),
                    ],
                    sourceIds,
                  )
                }
              />
              <Button
                title="Adicionar material"
                variant="ghost"
                icon="plus"
                onPress={() => go('new')}
              />
            </>
          ) : null}
          {stage === 'manual' ? (
            <>
              <Field
                label="O que você quer estudar?"
                placeholder="Ex.: Acidose metabólica"
                value={query}
                onChangeText={setQuery}
              />
              {matchingTopics.map((topic) => (
                <Card
                  key={topic.id}
                  label={`Escolher ${topic.name}`}
                  onPress={() => void chooseTopics([topic.id])}
                >
                  <View style={s.row}>
                    <Icon name="book-open" />
                    <T style={{ flex: 1, fontFamily: fonts.medium }}>{topic.name}</T>
                    <Icon name="chevron-right" size={18} />
                  </View>
                  <T muted style={{ fontSize: 12 }}>
                    {data.subjects.find((subject) => subject.id === topic.subjectId)?.name} ·{' '}
                    {data.questions.filter((question) => question.topicId === topic.id).length}{' '}
                    questões disponíveis
                  </T>
                </Card>
              ))}
              {!data.topics.length ? (
                <Empty
                  title="Escolha seu primeiro assunto"
                  message="Adicione um conteúdo com o nome do assunto. Depois você poderá cadastrar suas questões e iniciar a prática."
                />
              ) : !matchingTopics.length ? (
                <Empty
                  title="Ainda não há questões para esse assunto"
                  message="Adicione seu conteúdo ou cadastre questões. A geração de novos assuntos por IA ainda não está conectada."
                />
              ) : null}
              <Button
                title={
                  query.trim()
                    ? `Adicionar conteúdo: ${query.trim().slice(0, 50)}`
                    : 'Adicionar um assunto com meu material'
                }
                variant="secondary"
                icon="plus"
                onPress={() => {
                  setTitle(query.trim());
                  go('new');
                }}
              />
              <T muted style={{ fontSize: 12, lineHeight: 21 }}>
                A busca usa os assuntos e conceitos já disponíveis. A estruturação de novos temas
                por IA será conectada a um serviço de geração com fontes.
              </T>
            </>
          ) : null}
          {stage === 'new' ? (
            <>
              <Choices>
                <Choice label="Texto / anotação" selected onPress={() => setFileInfo(false)} />
                {['PDF', 'Slides', 'Imagem', 'Áudio / aula'].map((label) => (
                  <Choice
                    key={label}
                    label={label}
                    selected={false}
                    onPress={() => setFileInfo(true)}
                  />
                ))}
              </Choices>
              {fileInfo ? (
                <Notice text="Upload, OCR e transcrição ainda não estão conectados. Por enquanto, cole o texto ou escreva uma anotação. Nenhum arquivo será apresentado como analisado." />
              ) : null}
              <Card>
                <T style={s.sectionTitle}>Conteúdo para praticar</T>
                <Field
                  label="Título do conteúdo"
                  value={title}
                  onChangeText={setTitle}
                  maxLength={100}
                  placeholder="Ex.: Aula de equilíbrio ácido-base"
                />
                <T style={{ fontFamily: fonts.medium }}>Disciplina</T>
                <Choices>
                  {data.subjects.map((subject) => (
                    <Choice
                      key={subject.id}
                      label={subject.name}
                      selected={subjectId === subject.id}
                      onPress={() => setSubjectId(subject.id)}
                    />
                  ))}
                </Choices>
                <Field
                  label="Texto ou anotação"
                  value={body}
                  onChangeText={setBody}
                  multiline
                  maxLength={10000}
                  placeholder="Cole o texto que quer estudar. Não inclua dados de pacientes."
                />
                <Button
                  title={busy ? 'Salvando conteúdo...' : 'Salvar e escolher conteúdo'}
                  disabled={busy || !title.trim() || !body.trim()}
                  onPress={async () => {
                    if (lock.current) return;
                    setBusy(true);
                    lock.current = true;
                    setError('');
                    try {
                      let material = data.materials.find(
                        (item) =>
                          item.id === savedNote.current &&
                          item.title === title.trim() &&
                          item.content === body.trim() &&
                          item.subjectId === subjectId,
                      );
                      if (!material) {
                        material = await services.materialService.addNote(title, body, {
                          subjectId,
                          topicName: title,
                        });
                        savedNote.current = material.id;
                      }
                      await repository.flush();
                      if (repository.storageError)
                        throw new Error(
                          'O texto foi adicionado, mas não foi possível gravar no dispositivo.',
                        );
                      lock.current = false;
                      await chooseTopics([material.topicId], [`material:${material.id}`]);
                    } catch (reason) {
                      setError(
                        reason instanceof Error
                          ? reason.message
                          : 'Não foi possível salvar. Tente novamente.',
                      );
                    } finally {
                      lock.current = false;
                      setBusy(false);
                    }
                  }}
                />
                {savedNote.current ? (
                  <T muted style={{ fontSize: 12, lineHeight: 20 }}>
                    Este conteúdo já foi salvo. Se alterar o título, texto ou disciplina, uma nova
                    anotação será criada.
                  </T>
                ) : null}
              </Card>
              <T muted style={{ lineHeight: 21, fontSize: 12 }}>
                O texto será salvo literalmente. A identificação automática de subtópicos e a
                geração de novas questões dependem da futura integração com IA.
              </T>
            </>
          ) : null}
          {stage === 'topics' ? (
            <>
              {analysis?.sources.length ? (
                <Card>
                  <T style={s.sectionTitle}>Conteúdo selecionado</T>
                  {analysis.sources.map((source) => (
                    <View key={source.id} style={{ gap: 5 }}>
                      <T style={{ fontFamily: fonts.medium }}>{source.title}</T>
                      {source.content ? (
                        <T muted numberOfLines={3} style={{ fontSize: 12, lineHeight: 20 }}>
                          {source.content}
                        </T>
                      ) : (
                        <T muted style={{ fontSize: 12 }}>
                          Arquivo demonstrativo sem texto extraído.
                        </T>
                      )}
                    </View>
                  ))}
                </Card>
              ) : null}
              {analysis?.limitation ? <Notice text={analysis.limitation} /> : null}
              {analysis?.concepts.length ? (
                <>
                  <T style={s.sectionTitle}>Conceitos disponíveis para praticar</T>
                  {analysis.concepts.map((concept) => {
                    const mastery = estimateConceptMastery(data, concept.id);
                    return (
                      <Card
                        key={concept.id}
                        label={`Selecionar conceito ${concept.name}`}
                        onPress={() =>
                          update({
                            conceptIds: config.conceptIds.includes(concept.id)
                              ? config.conceptIds.filter((id) => id !== concept.id)
                              : [...config.conceptIds, concept.id],
                          })
                        }
                        style={{
                          borderColor: config.conceptIds.includes(concept.id)
                            ? colors.primary
                            : colors.line,
                        }}
                      >
                        <View style={s.row}>
                          <Icon
                            name={
                              config.conceptIds.includes(concept.id) ? 'check-square' : 'square'
                            }
                          />
                          <View style={{ flex: 1, gap: 4 }}>
                            <T style={{ fontFamily: fonts.medium }}>{concept.name}</T>
                            <T muted style={{ fontSize: 11 }}>
                              {mastery.exposures
                                ? `${mastery.value}% estimado · ${mastery.exposures} respostas`
                                : 'Ainda sem evidência de domínio'}
                            </T>
                          </View>
                        </View>
                        {mastery.exposures ? <Progress value={mastery.value} height={4} /> : null}
                      </Card>
                    );
                  })}
                  <Button
                    title="Configurar sessão"
                    disabled={!config.conceptIds.length}
                    onPress={() => go('config')}
                  />
                </>
              ) : (
                <>
                  <Empty
                    title="Seu conteúdo está salvo. Falta o banco de questões."
                    message="Você pode cadastrar uma questão vinculada a este conteúdo. A geração automática não foi simulada."
                  />
                  <Button title="Criar questão com esta fonte" onPress={authorQuestion} />
                </>
              )}
            </>
          ) : null}
          {stage === 'config' ? (
            <PracticeSettings
              config={config}
              update={update}
              busy={busy}
              questionId={questionId}
              form={{ quantity, setQuantity, customCount, setCustomCount, timer, setTimer }}
              go={go}
              start={start}
              authorQuestion={authorQuestion}
            />
          ) : null}
        </View>
      </BottomSheet>
    </Screen>
  );
}
