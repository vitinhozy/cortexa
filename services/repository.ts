import type { AppData } from '@/types/domain';
import type { StorageAdapter } from './contracts';
import { createSeed } from '@/mocks/seed';
import { reconcilePersonalProgress } from '@/features/study/progress';
import { validStoredDocument } from '@/features/study/studio';
import { validPracticeState } from '@/features/study/practice';
import { validSnapshot } from '@/features/study/validation';
import { migrateSnapshot } from './migrations';
export const STORAGE_KEY = 'cortexa:demo:v1';
export class LocalRepository {
  private data: AppData;
  constructor(
    private initialData: () => AppData = createSeed,
    private storageKey = STORAGE_KEY,
  ) {
    this.data = migrateSnapshot(initialData());
  }
  private listeners = new Set<() => void>();
  private writes = Promise.resolve();
  private storage?: StorageAdapter;
  private persistenceBlocked = false;
  storageError = false;
  getSnapshot = () => this.data;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  async hydrate(storage: StorageAdapter) {
    this.storage = storage;
    try {
      const raw = await storage.getItem(this.storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<AppData>;
        const arrays = [
          'topics',
          'subjects',
          'materials',
          'questions',
          'attempts',
          'flashcards',
          'reviews',
          'sessions',
          'exams',
          'plans',
          'metrics',
          'conversations',
          'mistakes',
        ] as const;
        if (
          !validSnapshot(parsed) ||
          parsed.version !== 1 ||
          !parsed.user?.id ||
          !parsed.preferences ||
          !arrays.every((key) => Array.isArray(parsed[key])) ||
          (parsed.workspace ?? 'demo') !== (this.data.workspace ?? 'demo') ||
          (this.data.workspace === 'personal' && parsed.user.id !== this.data.user.id) ||
          (parsed.folders !== undefined && !Array.isArray(parsed.folders)) ||
          !validPracticeState(parsed.practice) ||
          (parsed.studio !== undefined &&
            (!Array.isArray(parsed.studio) || !parsed.studio.every(validStoredDocument)))
        )
          throw new Error('Invalid local snapshot');
        const hydrated = parsed as AppData;
        const demo = this.data.workspace !== 'personal' ? this.initialData().questions : [];
        const additions = demo.filter(
          (question) => !hydrated.questions.some((item) => item.id === question.id),
        );
        const questions = hydrated.questions.map((question) => {
          const fixture = !question.authored && demo.find((item) => item.id === question.id);
          return fixture
            ? {
                ...question,
                conceptId: question.conceptId ?? fixture.conceptId,
                conceptName: question.conceptName ?? fixture.conceptName,
                format: question.format ?? fixture.format,
                level: question.level ?? fixture.level,
                prerequisiteConceptId:
                  question.prerequisiteConceptId ?? fixture.prerequisiteConceptId,
              }
            : question;
        });
        this.data = reconcilePersonalProgress(
          migrateSnapshot({
            ...hydrated,
            questions: [...questions, ...additions],
          }),
        );
      }
    } catch {
      this.storageError = true;
      this.persistenceBlocked = true;
    }
    this.emit();
  }
  update = (transform: (data: AppData) => AppData) => {
    const next = transform(this.data);
    if (next === this.data) return;
    this.data = reconcilePersonalProgress(next);
    this.emit();
    const snapshot = JSON.stringify(this.data);
    this.writes = this.writes.then(async () => {
      try {
        if (this.persistenceBlocked) return;
        await this.storage?.setItem(this.storageKey, snapshot);
        if (this.storageError) {
          this.storageError = false;
          this.data = { ...this.data };
          this.emit();
        }
      } catch {
        this.storageError = true;
        this.data = { ...this.data };
        this.emit();
      }
    });
  };
  private emit() {
    this.listeners.forEach((listener) => listener());
  }
  async flush() {
    await this.writes;
    return !this.storageError && !this.persistenceBlocked;
  }
  async retryPersistence() {
    if (this.persistenceBlocked) return false;
    this.update((data) => ({ ...data }));
    return this.flush();
  }
  reset() {
    this.persistenceBlocked = false;
    this.storageError = false;
    this.update(() => this.initialData());
  }
}
