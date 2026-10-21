import { useRef, useState } from 'react';
import { Button, Card, Field, Notice, Screen, T, s } from './ui';
import { Choice, Choices } from './Choice';
import { useStudy } from '@/hooks/useStudy';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { academicStageLabels, learningGoalLabels } from '@/constants/academic';
import { academicStages, emptyJourney } from '@/features/study/academic';
import type { AcademicStage, CourseEntry, AcademicJourney } from '@/types/academic';

export function ProfileForm({ onboarding = false }: { onboarding?: boolean }) {
  const { dismissTo } = useAppNavigation();
  const { data, services, repository } = useStudy();
  const journey = data.academicJourney ?? emptyJourney();
  const [name, setName] = useState(
    onboarding && !data.user.onboardingComplete ? '' : data.user.name,
  );
  const [stage, setStage] = useState<AcademicStage>(journey.stage);
  const [confirm, setConfirm] = useState(false);
  const [details, setDetails] = useState(!onboarding);
  const [formation, setFormation] = useState(false);
  const [course, setCourse] = useState(data.user.course);
  const [semester, setSemester] = useState(
    journey.semesterConfirmed ? String(data.user.semester) : '',
  );
  const [university, setUniversity] = useState(data.user.university);
  const [goal, setGoal] = useState(data.user.goal);
  const [learningGoal, setLearningGoal] = useState<AcademicJourney['learningGoal']>(
    journey.learningGoal,
  );
  const [minutes, setMinutes] = useState(String(data.user.dailyMinutes ?? 30));
  const [subjects, setSubjects] = useState(data.user.subjectIds ?? []);
  const [newSubject, setNewSubject] = useState('');
  const [entryYear, setEntryYear] = useState(
    journey.courseEntry?.precision === 'year'
      ? String(journey.courseEntry.year)
      : (journey.courseEntry?.date.slice(0, 4) ?? ''),
  );
  const [entryDate, setEntryDate] = useState(
    journey.courseEntry?.precision === 'date' ? journey.courseEntry.date : '',
  );
  const [year, setYear] = useState(journey.currentYear ? String(journey.currentYear) : '');
  const [curriculum, setCurriculum] = useState(journey.curriculum ?? '');
  const [modules, setModules] = useState(journey.modules.join(', '));
  const [rotation, setRotation] = useState(journey.rotation ?? '');
  const [specialty, setSpecialty] = useState(journey.specialtyInterest ?? '');
  const [residency, setResidency] = useState(journey.residencyGoal ?? '');
  const [topicIds, setTopicIds] = useState(journey.currentTopicIds);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const changedStage = stage !== journey.stage && journey.stage !== 'UNKNOWN';
  async function save() {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError('');
    try {
      if (entryDate && entryYear && Number(entryYear) !== Number(entryDate.slice(0, 4)))
        throw new Error('O ano e a data de ingresso precisam corresponder.');
      const courseEntry: CourseEntry | undefined = entryDate
        ? { precision: 'date', date: entryDate }
        : entryYear
          ? { precision: 'year', year: Number(entryYear) }
          : undefined;
      await services.profileService.save({
        name,
        course,
        semester: semester.trim() ? Number(semester) : data.user.semester,
        university,
        goal,
        dailyMinutes: Number(minutes),
        subjectIds: subjects,
        journey: {
          stage,
          learningGoal,
          semesterConfirmed: !!semester.trim(),
          courseEntry,
          currentYear: year ? Number(year) : undefined,
          curriculum: curriculum.trim() || undefined,
          modules: modules
            .split(',')
            .map((v) => v.trim())
            .filter(Boolean),
          rotation: rotation.trim() || undefined,
          specialtyInterest: specialty.trim() || undefined,
          residencyGoal: residency.trim() || undefined,
          currentTopicIds: topicIds,
          confirmTransition: confirm,
        },
      });
      if (!(await repository.flush()))
        throw new Error(
          'Perfil atualizado nesta sessão, mas não foi possível gravar no dispositivo.',
        );
      dismissTo(onboarding ? '/overview' : '/profile');
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Não foi possível salvar.');
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  return (
    <Screen
      title={onboarding ? 'Seu estudo começa aqui.' : 'Seu perfil acadêmico'}
      subtitle="Conte o essencial. Você pode ajustar tudo depois."
      back
      eyebrow={onboarding ? 'BEM-VINDO AO SEU ESPAÇO' : 'DO SEU JEITO'}
    >
      <Card>
        <Field
          label="Como você quer ser chamado?"
          value={name}
          onChangeText={setName}
          maxLength={80}
          autoComplete="name"
        />
        <T style={s.sectionTitle}>Em que momento da Medicina você está?</T>
        <Choices>
          {academicStages.map((value) => (
            <Choice
              key={value}
              label={academicStageLabels[value]}
              selected={stage === value}
              onPress={() => {
                setStage(value);
                setConfirm(false);
              }}
            />
          ))}
        </Choices>
        <T muted>
          O semestre não define sua etapa automaticamente. Escolha o que faz sentido para seu
          currículo.
        </T>
        {changedStage ? (
          <>
            <Notice text="A mudança adapta as próximas práticas. Seu histórico anterior mantém a etapa em que foi registrado." />
            <Choice
              label="Confirmo minha mudança de etapa"
              selected={confirm}
              onPress={() => setConfirm((v) => !v)}
            />
          </>
        ) : null}
      </Card>
      {onboarding ? (
        <Button
          title={details ? 'Deixar os detalhes para depois' : 'Adicionar contexto (opcional)'}
          variant="ghost"
          onPress={() => setDetails((v) => !v)}
        />
      ) : null}
      {details ? (
        <>
          <Card>
            <Field label="Curso" value={course} onChangeText={setCourse} maxLength={80} />
            <Field
              label="Semestre"
              placeholder="Pode informar depois"
              value={semester}
              onChangeText={setSemester}
              keyboardType="number-pad"
              maxLength={2}
            />
            <Field
              label="Universidade (opcional)"
              value={university}
              onChangeText={setUniversity}
              maxLength={120}
            />
            <Field
              label="Ano de ingresso (opcional)"
              value={entryYear}
              onChangeText={setEntryYear}
              keyboardType="number-pad"
              maxLength={4}
            />
            <T muted>Se souber apenas o ano, não precisa escolher uma data.</T>
          </Card>
          <Card>
            <T style={s.sectionTitle}>Disciplinas atuais (opcional)</T>
            <Field
              label="Nova disciplina (opcional)"
              value={newSubject}
              onChangeText={setNewSubject}
              maxLength={80}
            />
            {newSubject.trim() ? (
              <Button
                title="Adicionar disciplina"
                variant="secondary"
                disabled={busy}
                onPress={async () => {
                  if (pending.current) return;
                  pending.current = true;
                  setBusy(true);
                  try {
                    const subject = await services.subjectService.add(newSubject);
                    if (!(await repository.flush()))
                      throw new Error('Não foi possível gravar a disciplina no dispositivo.');
                    setSubjects((ids) => [...new Set([...ids, subject.id])]);
                    setNewSubject('');
                  } catch (failure) {
                    setError(
                      failure instanceof Error
                        ? failure.message
                        : 'Não foi possível adicionar a disciplina.',
                    );
                  } finally {
                    pending.current = false;
                    setBusy(false);
                  }
                }}
              />
            ) : null}
            <Choices>
              {data.subjects.map((subject) => (
                <Choice
                  key={subject.id}
                  label={subject.name}
                  selected={subjects.includes(subject.id)}
                  onPress={() =>
                    setSubjects((ids) =>
                      ids.includes(subject.id)
                        ? ids.filter((id) => id !== subject.id)
                        : [...ids, subject.id],
                    )
                  }
                />
              ))}
            </Choices>
            {data.topics.length ? (
              <>
                <T style={s.sectionTitle}>Assuntos atuais (opcional)</T>
                <Choices>
                  {data.topics.map((topic) => (
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
              </>
            ) : null}
          </Card>
          <Card>
            <Field
              label="Seu objetivo"
              placeholder="Ex.: Manter as revisões em dia"
              value={goal}
              onChangeText={setGoal}
              maxLength={200}
            />
            <T style={s.sectionTitle}>Seu foco agora (opcional)</T>
            <Choices>
              {(
                Object.keys(learningGoalLabels) as NonNullable<AcademicJourney['learningGoal']>[]
              ).map((value) => (
                <Choice
                  key={value}
                  label={learningGoalLabels[value]}
                  selected={learningGoal === value}
                  onPress={() =>
                    setLearningGoal((previous) => (previous === value ? undefined : value))
                  }
                />
              ))}
            </Choices>
            <Field
              label="Minutos de estudo por dia"
              value={minutes}
              onChangeText={setMinutes}
              keyboardType="number-pad"
              maxLength={3}
            />
            <T muted>
              A meta semanal considera cinco dias. Você pode começar sem escolher disciplinas ou um
              objetivo detalhado.
            </T>
          </Card>
          <Button
            title={
              formation ? 'Recolher detalhes da formação' : 'Mais sobre minha formação (opcional)'
            }
            variant="ghost"
            onPress={() => setFormation((v) => !v)}
          />
          {formation ? (
            <Card>
              <Field
                label="Data de ingresso (AAAA-MM-DD)"
                value={entryDate}
                onChangeText={setEntryDate}
                maxLength={10}
              />
              <Field
                label="Ano atual do curso (opcional)"
                value={year}
                onChangeText={setYear}
                keyboardType="number-pad"
                maxLength={2}
              />
              <Field
                label="Modelo curricular (opcional)"
                value={curriculum}
                onChangeText={setCurriculum}
                maxLength={200}
              />
              <Field
                label="Módulos atuais, separados por vírgula"
                value={modules}
                onChangeText={setModules}
                maxLength={1000}
              />
              <Field
                label="Estágio ou rotação atual (opcional)"
                value={rotation}
                onChangeText={setRotation}
                maxLength={200}
              />
              <Field
                label="Interesse em especialidade (opcional)"
                value={specialty}
                onChangeText={setSpecialty}
                maxLength={200}
              />
              <Field
                label="Residência desejada (opcional)"
                value={residency}
                onChangeText={setResidency}
                maxLength={200}
              />
            </Card>
          ) : null}
        </>
      ) : null}
      <Notice text="Seus dados de estudo ficam neste dispositivo. Nenhum desempenho demonstrativo será copiado para o espaço pessoal." />
      {error ? <Notice text={error} /> : null}
      <Button
        title={busy ? 'Salvando...' : onboarding ? 'Começar meu estudo' : 'Salvar perfil'}
        disabled={busy}
        onPress={save}
      />
      {onboarding ? (
        <Button
          title="Explorar sem personalizar"
          variant="ghost"
          onPress={() => dismissTo('/overview')}
        />
      ) : null}
    </Screen>
  );
}
