import type { AppData } from '@/types/domain';
import type { StorageAdapter } from './contracts';
import { createSeed } from '@/mocks/seed';
export const STORAGE_KEY = 'cortexa:demo:v1';
export class LocalRepository {
  private data = createSeed();
  private listeners = new Set<() => void>();
  private writes = Promise.resolve();
  private storage?: StorageAdapter;
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
      const raw = await storage.getItem(STORAGE_KEY);
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
          parsed.version !== 1 ||
          !parsed.user?.id ||
          !parsed.preferences ||
          !arrays.every((key) => Array.isArray(parsed[key]))
        )
          throw new Error('Invalid local snapshot');
        this.data = parsed as AppData;
      }
    } catch {
      this.storageError = true;
    }
    this.emit();
  }
  update = (transform: (data: AppData) => AppData) => {
    this.data = transform(this.data);
    this.emit();
    const snapshot = JSON.stringify(this.data);
    this.writes = this.writes.then(async () => {
      try {
        await this.storage?.setItem(STORAGE_KEY, snapshot);
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
  }
  reset() {
    this.update(() => createSeed());
  }
}
