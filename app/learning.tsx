import { useMemo } from 'react';
import { router } from 'expo-router';
import { Button, Card, Empty, Notice, Progress, Screen, T, s } from '@/components/ui';
import { useStudy } from '@/hooks/useStudy';
import { learnerModel, studyRecommendations } from '@/features/study/learner';
import { academicStageLabels } from '@/constants/academic';
import { studySources } from '@/features/study/practice';
import { formatDate } from '@/utils/date';
import type { StudyEvent } from '@/types/learning';

const eventLabels: Record<StudyEvent['type'], string> = {
  QUESTION_ATTEMPT: 'Questão respondida',
  FLASHCARD_REVIEW: 'Flashcard revisado',
  DOCUMENT_STUDIED: 'Estudo concluído',
  CHAT_CONCEPT_DISCUSSION: 'Conceito discutido · simulação',
  SIMULATION_COMPLETED: 'Simulado entregue',
  MATERIAL_ANALYSIS_REVIEWED: 'Conceitos do material revisados',
};
export default function LearningScreen() {
  const { data } = useStudy();
  const model = useMemo(() => learnerModel(data), [data]);
  const recommendations = useMemo(() => studyRecommendations(data).slice(0, 3), [data]);
  const sources = useMemo(
    () => new Map(studySources(data).map((source) => [source.id, source.title])),
    [data],
  );
  return (
    <Screen
      title="Sua jornada de aprendizagem"
      subtitle="Sua formação, suas evidências e o próximo passo."
      back
      backTo="/profile"
    >
      <Card>
        <T style={s.sectionTitle}>{academicStageLabels[model.journey.stage]}</T>
        <T>{model.pedagogy.objective}</T>
        <T muted>
          {model.academic.semester
            ? `${model.academic.semester}º semestre informado`
            : 'Semestre ainda não informado'}
          {model.journey.courseEntry
            ? ` · ingresso: ${model.journey.courseEntry.precision === 'year' ? model.journey.courseEntry.year : formatDate(model.journey.courseEntry.date)}`
            : ''}
        </T>
        <Button
          title="Atualizar minha formação"
          variant="secondary"
          onPress={() => router.push('/profile-edit')}
        />
      </Card>
      {model.simulated ? (
        <Notice text="Espaço de demonstração. Conteúdo fictício e atividades feitas com os exemplos ficam separados dos seus dados pessoais." />
      ) : null}
      <T style={s.sectionTitle}>O que estudar agora</T>
      {recommendations.length ? (
        recommendations.map((item) => (
          <Card key={item.conceptId}>
            <T style={s.sectionTitle}>
              {model.concepts.find((c) => c.id === item.conceptId)?.name}
            </T>
            <T>{item.explanation}</T>
            <Button
              title="Começar prática recomendada"
              onPress={() =>
                router.push(
                  data.questions.some((q) => (q.conceptId ?? q.topicId) === item.conceptId)
                    ? {
                        pathname: '/questions',
                        params: {
                          topicId: item.topicId,
                          conceptIds: item.conceptId,
                          kind: 'review',
                        },
                      }
                    : { pathname: '/flashcards', params: { topicId: item.topicId } },
                )
              }
            />
          </Card>
        ))
      ) : (
        <Empty
          title="Vamos construir sua memória"
          message="Adicione uma anotação, cadastre uma questão ou um cartão e comece a praticar."
        />
      )}
      <T style={s.sectionTitle}>Memória por conceito</T>
      <Notice text="Domínio é uma estimativa heurística, não uma certificação. Autoavaliações de flashcards têm peso menor que respostas objetivas. Apenas ler ou conversar não aumenta o domínio." />
      {model.concepts.map((concept) => (
        <Card key={concept.id}>
          <T style={s.sectionTitle}>{concept.name}</T>
          <T>
            {concept.mastery.exposures
              ? `${concept.mastery.value}% estimado`
              : 'Ainda sem evidência de desempenho'}
          </T>
          {concept.mastery.exposures ? <Progress value={concept.mastery.value} /> : null}
          <T muted>
            {concept.mastery.objectiveExposures ?? 0} respostas objetivas ·{' '}
            {concept.mastery.selfReportedExposures ?? 0} autoavaliações
          </T>
          {!concept.mastery.sufficientEvidence && concept.mastery.exposures ? (
            <T muted>Evidência inicial. Continue praticando em momentos diferentes.</T>
          ) : null}
          {concept.review ? <T>Próxima revisão: {formatDate(concept.review.dueAt)}</T> : null}
          {concept.mastery.highConfidenceErrors ? (
            <T>Um erro com alta confiança merece comparação cuidadosa do raciocínio.</T>
          ) : null}
          {concept.sourceIds.length ? (
            <T muted>
              Origem vinculada:{' '}
              {concept.sourceIds.map((id) => sources.get(id) ?? 'Fonte não disponível').join(' · ')}
            </T>
          ) : null}
          {concept.history.length ? (
            <T muted>
              Última atualização:{' '}
              {concept.history.at(-1)!.before === null
                ? 'sem evidência'
                : `${concept.history.at(-1)!.before}%`}{' '}
              → {concept.history.at(-1)!.after}%
            </T>
          ) : null}
        </Card>
      ))}
      <T style={s.sectionTitle}>Atividade recente</T>
      {model.recentEvents.length ? (
        model.recentEvents.slice(0, 15).map((event) => (
          <Card key={event.id}>
            <T>{eventLabels[event.type]}</T>
            <T muted>
              {formatDate(event.occurredAt)} · {academicStageLabels[event.academicStage]}
            </T>
            {event.type === 'QUESTION_ATTEMPT' ? (
              <T>
                {event.correct ? 'Acerto' : 'Erro para revisar'}
                {event.confidence === 'certain'
                  ? ' · respondeu com certeza'
                  : event.confidence === 'guess'
                    ? ' · chute declarado'
                    : ''}
              </T>
            ) : null}
            {event.type === 'SIMULATION_COMPLETED' ? (
              <T>
                {event.answered} de {event.total} questões respondidas
              </T>
            ) : null}
            {event.provenance === 'legacy' ? (
              <T muted>
                Histórico anterior: dados acadêmicos não registrados permanecem desconhecidos.
              </T>
            ) : null}
          </Card>
        ))
      ) : (
        <T muted>Suas atividades aparecerão aqui depois do primeiro estudo.</T>
      )}
      {model.journey.transitions.length ? (
        <>
          <T style={s.sectionTitle}>Etapas confirmadas por você</T>
          {model.journey.transitions.map((transition) => (
            <T key={transition.id}>
              {formatDate(transition.confirmedAt)} · {academicStageLabels[transition.from]} →{' '}
              {academicStageLabels[transition.to]}
            </T>
          ))}
        </>
      ) : null}
    </Screen>
  );
}
