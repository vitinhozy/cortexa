import type { AcademicProfile, Exam } from '@/types/domain';
import type { Repository } from './contracts';
import { localDate, uid } from '@/utils/date';
import { FOLDER_PALETTE } from '@/constants/folderPalette';
import { emptyJourney, updateJourney } from '@/features/study/academic';

function name(value: string, label: string, limit = 100) {
  const clean = value.trim();
  if (!clean || clean.length > limit)
    throw new Error(`${label}: informe de 1 a ${limit} caracteres.`);
  return clean;
}
export function createWorkspaceServices(repo: Repository) {
  return {
    subjectService: {
      async add(value: string) {
        const title = name(value, 'Disciplina', 80);
        const existing = repo
          .getSnapshot()
          .subjects.find(
            (s) => s.name.toLocaleLowerCase('pt-BR') === title.toLocaleLowerCase('pt-BR'),
          );
        if (existing) return existing;
        const subject = { id: uid('subject'), name: title, color: '#7C3AED' };
        repo.update((data) => ({ ...data, subjects: [...data.subjects, subject] }));
        return subject;
      },
    },
    profileService: {
      async save(input: AcademicProfile) {
        const data = repo.getSnapshot();
        if (!Number.isInteger(input.semester) || input.semester < 1 || input.semester > 16)
          throw new Error('Informe um semestre entre 1 e 16.');
        if (
          !Number.isInteger(input.dailyMinutes) ||
          input.dailyMinutes < 5 ||
          input.dailyMinutes > 480
        )
          throw new Error('Escolha de 5 a 480 minutos por dia.');
        if (input.subjectIds.some((id) => !data.subjects.some((s) => s.id === id)))
          throw new Error('Selecione disciplinas deste espaço de estudo.');
        if (input.goal.trim().length > 200)
          throw new Error('Use até 200 caracteres para seu objetivo.');
        const academicJourney = input.journey
          ? updateJourney(data, input.journey, new Date().toISOString(), uid('stage'))
          : { ...(data.academicJourney ?? emptyJourney()), semesterConfirmed: true };
        const profile = {
          name: name(input.name, 'Nome', 80),
          course: name(input.course, 'Curso', 80),
          semester: input.semester,
          dailyMinutes: input.dailyMinutes,
          university: input.university.trim().slice(0, 120),
          goal: input.goal.trim(),
          subjectIds: [...new Set(input.subjectIds)],
          onboardingComplete: true,
        };
        repo.update((current) => ({
          ...current,
          academicJourney,
          user: { ...current.user, ...profile, weeklyGoal: input.dailyMinutes * 5 },
        }));
      },
    },
    folderService: {
      async create(value: string, color?: string) {
        if (color && !FOLDER_PALETTE.some((item) => item.color === color))
          throw new Error('Escolha uma das cores disponíveis para a pasta.');
        const folder = {
          id: uid('folder'),
          name: name(value, 'Pasta', 60),
          color: color ?? FOLDER_PALETTE[0].color,
        };
        if (
          repo
            .getSnapshot()
            .folders?.some(
              (f) => f.name.toLocaleLowerCase('pt-BR') === folder.name.toLocaleLowerCase('pt-BR'),
            )
        )
          throw new Error('Já existe uma pasta com esse nome.');
        repo.update((data) => ({ ...data, folders: [...(data.folders ?? []), folder] }));
        return folder;
      },
      async rename(id: string, value: string, color?: string) {
        if (color && !FOLDER_PALETTE.some((item) => item.color === color))
          throw new Error('Escolha uma das cores disponíveis para a pasta.');
        const next = name(value, 'Pasta', 60);
        const folders = repo.getSnapshot().folders ?? [];
        if (!folders.some((f) => f.id === id)) throw new Error('Pasta não encontrada.');
        if (
          folders.some(
            (f) =>
              f.id !== id && f.name.toLocaleLowerCase('pt-BR') === next.toLocaleLowerCase('pt-BR'),
          )
        )
          throw new Error('Já existe uma pasta com esse nome.');
        repo.update((data) => ({
          ...data,
          folders: data.folders?.map((f) =>
            f.id === id ? { ...f, name: next, ...(color ? { color } : {}) } : f,
          ),
        }));
      },
      async remove(id: string) {
        repo.update((data) => ({
          ...data,
          folders: data.folders?.filter((f) => f.id !== id),
          materials: data.materials.map((m) =>
            m.folderId === id ? { ...m, folderId: undefined } : m,
          ),
        }));
      },
      async moveMaterial(id: string, folderId?: string) {
        const data = repo.getSnapshot();
        if (!data.materials.some((m) => m.id === id)) throw new Error('Material não encontrado.');
        if (folderId && !data.folders?.some((f) => f.id === folderId))
          throw new Error('Pasta não encontrada.');
        repo.update((current) => ({
          ...current,
          materials: current.materials.map((m) => (m.id === id ? { ...m, folderId } : m)),
        }));
      },
      async favoriteMaterial(id: string) {
        repo.update((data) => ({
          ...data,
          materials: data.materials.map((m) => (m.id === id ? { ...m, favorite: !m.favorite } : m)),
        }));
      },
      async openMaterial(id: string) {
        repo.update((data) => ({
          ...data,
          materials: data.materials.map((m) =>
            m.id === id ? { ...m, lastOpenedAt: new Date().toISOString() } : m,
          ),
        }));
      },
    },
    examService: {
      async add(input: Omit<Exam, 'id'>) {
        const data = repo.getSnapshot();
        const date = new Date(`${input.date}T12:00:00`);
        if (
          !/^\d{4}-\d{2}-\d{2}$/.test(input.date) ||
          !Number.isFinite(date.getTime()) ||
          localDate(date) !== input.date ||
          input.date < localDate()
        )
          throw new Error('Informe uma data válida a partir de hoje (AAAA-MM-DD).');
        if (!data.subjects.some((s) => s.id === input.subjectId))
          throw new Error('Selecione uma disciplina.');
        if (
          input.topicIds.some(
            (id) => !data.topics.some((t) => t.id === id && t.subjectId === input.subjectId),
          )
        )
          throw new Error('Escolha assuntos da disciplina selecionada.');
        const exam = { ...input, id: uid('exam'), title: name(input.title, 'Prova') };
        repo.update((current) => ({
          ...current,
          exams: [...current.exams, exam].sort((a, b) => a.date.localeCompare(b.date)),
        }));
        return exam;
      },
      async remove(id: string) {
        repo.update((data) => ({ ...data, exams: data.exams.filter((e) => e.id !== id) }));
      },
    },
  };
}
