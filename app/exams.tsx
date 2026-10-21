import { useState } from 'react';
import { router } from 'expo-router';
import { Screen, Card, T, Field, Button, Notice, Empty, s } from '@/components/ui';
import { Choice, Choices } from '@/components/Choice';
import { useStudy } from '@/hooks/useStudy';
import { formatDate } from '@/utils/date';

export default function ExamsScreen() {
  const { data, services } = useStudy();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [subjectId, setSubjectId] = useState(
    data.user.subjectIds?.[0] ?? data.subjects[0]?.id ?? '',
  );
  const [topicIds, setTopicIds] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [removeId, setRemoveId] = useState('');
  return (
    <Screen title="Minhas provas" subtitle="Uma data clara ajuda a escolher o próximo passo." back>
      <Card>
        <T style={s.sectionTitle}>Adicionar prova</T>
        <Field
          label="Nome da prova"
          value={title}
          onChangeText={setTitle}
          maxLength={100}
          placeholder="Ex.: Avaliação de Anatomia"
        />
        <Field
          label="Data (AAAA-MM-DD)"
          value={date}
          onChangeText={setDate}
          maxLength={10}
          placeholder="2026-11-20"
        />
        <T>Disciplina</T>
        <Choices>
          {data.subjects.map((subject) => (
            <Choice
              key={subject.id}
              label={subject.name}
              selected={subjectId === subject.id}
              onPress={() => {
                setSubjectId(subject.id);
                setTopicIds([]);
              }}
            />
          ))}
        </Choices>
        <T>Assuntos (opcional)</T>
        <Choices>
          {data.topics
            .filter((topic) => topic.subjectId === subjectId)
            .map((topic) => (
              <Choice
                key={topic.id}
                label={topic.name}
                selected={topicIds.includes(topic.id)}
                onPress={() =>
                  setTopicIds((ids) =>
                    ids.includes(topic.id)
                      ? ids.filter((id) => id !== topic.id)
                      : [...ids, topic.id],
                  )
                }
              />
            ))}
        </Choices>
        <Button
          title={busy ? 'Salvando...' : 'Salvar prova'}
          disabled={busy}
          onPress={async () => {
            setBusy(true);
            setMessage('');
            try {
              await services.examService.add({ title, date, subjectId, topicIds });
              setTitle('');
              setDate('');
              setTopicIds([]);
              setMessage('Prova salva. Ela já aparece na sua agenda.');
            } catch (error) {
              setMessage(error instanceof Error ? error.message : 'Não foi possível salvar.');
            } finally {
              setBusy(false);
            }
          }}
        />
      </Card>
      {message ? <Notice text={message} /> : null}
      {!data.exams.length ? (
        <Empty
          title="Sua agenda está livre"
          message="Cadastre uma prova para acompanhar a data na tela inicial."
        />
      ) : (
        data.exams.map((exam) => (
          <Card key={exam.id}>
            <T style={s.sectionTitle}>{exam.title}</T>
            <T muted>
              {formatDate(exam.date)} ·{' '}
              {data.subjects.find((subject) => subject.id === exam.subjectId)?.name}
            </T>
            <Button
              title={`Planejar ${exam.title}`}
              variant="secondary"
              onPress={() => router.push({ pathname: '/planner', params: { examId: exam.id } })}
            />
            {removeId === exam.id ? (
              <>
                <T>Remover esta prova da agenda?</T>
                <Button
                  title="Confirmar remoção da prova"
                  onPress={async () => {
                    await services.examService.remove(exam.id);
                    setRemoveId('');
                  }}
                />
                <Button title="Cancelar" variant="ghost" onPress={() => setRemoveId('')} />
              </>
            ) : (
              <Button
                title={`Remover ${exam.title}`}
                variant="ghost"
                onPress={() => setRemoveId(exam.id)}
              />
            )}
          </Card>
        ))
      )}
    </Screen>
  );
}
