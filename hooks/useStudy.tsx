import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type PropsWithChildren,
} from 'react';
import { ActivityIndicator, Keyboard, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createServices } from '@/services';
import { LocalRepository } from '@/services/repository';
import { createPersonalWorkspace } from '@/services/personalWorkspace';
import { materialAnalysisTransport } from '@/services/materialAnalysisTransport';
import { aiTutorTransport } from '@/services/aiTutorTransport';
import { useAuth } from './useAuth';
import type { WorkspaceMode } from '@/types/domain';
import { colors, type AppearanceScheme } from '@/constants/theme';
import { useAppearance } from './useAppearance';

const MODE_KEY = 'cortexa:workspace';
const StudyContext = createContext<{
  repository: LocalRepository;
  services: ReturnType<typeof createServices>;
  mode: WorkspaceMode;
  scheme: AppearanceScheme;
  transitioning: boolean;
  switchWorkspace: (mode: WorkspaceMode) => Promise<void>;
} | null>(null);
export function WorkspaceLoading() {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        backgroundColor: colors.background,
      }}
    >
      <ActivityIndicator color={colors.primary} />
      <Text>Preparando seu espaço de estudo...</Text>
    </View>
  );
}
export function StudyProvider({ children }: PropsWithChildren) {
  const auth = useAuth();
  const { scheme } = useAppearance();
  const [mode, setMode] = useState<WorkspaceMode | null>(null);
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(MODE_KEY)
      .then((saved) => {
        if (active) setMode(saved === 'demo' ? 'demo' : 'personal');
      })
      .catch(() => {
        if (active) setMode('personal');
      });
    return () => {
      active = false;
    };
  }, []);
  if (!mode || !auth.ready) return <WorkspaceLoading />;
  const currentMode = auth.user ? 'personal' : mode;
  const owner = auth.user?.id ?? 'local';
  return (
    <Workspace
      mode={currentMode}
      owner={owner}
      scheme={scheme}
      switchWorkspace={async (next) => {
        if (auth.user) throw new Error('Saia da conta antes de trocar de espaço.');
        await AsyncStorage.setItem(MODE_KEY, next);
        setMode(next);
      }}
    >
      {children}
    </Workspace>
  );
}
function Workspace({
  children,
  mode,
  owner,
  scheme,
  switchWorkspace,
}: PropsWithChildren<{
  mode: WorkspaceMode;
  owner: string;
  scheme: AppearanceScheme;
  switchWorkspace: (mode: WorkspaceMode) => Promise<void>;
}>) {
  const candidate = useMemo(() => {
    const repository =
      mode === 'demo'
        ? new LocalRepository()
        : new LocalRepository(() => createPersonalWorkspace(owner), `cortexa:personal:${owner}:v1`);
    return {
      repository,
      mode,
      services: createServices(repository, { materialAnalysisTransport, aiTutorTransport }),
    };
  }, [mode, owner]);
  const [committed, setCommitted] = useState<typeof candidate | null>(null);
  useEffect(() => {
    let active = true;
    Keyboard.dismiss();
    candidate.repository.hydrate(AsyncStorage).finally(() => {
      if (active) setCommitted(candidate);
    });
    return () => {
      active = false;
    };
  }, [candidate]);
  if (!committed) return <WorkspaceLoading />;
  const transitioning = committed !== candidate;
  return (
    <StudyContext.Provider
      value={{
        repository: committed.repository,
        services: committed.services,
        mode: committed.mode,
        scheme,
        transitioning,
        switchWorkspace: async (next) => {
          await committed.repository.flush();
          await switchWorkspace(next);
        },
      }}
    >
      <View style={{ flex: 1 }}>
        <View
          style={{ flex: 1, display: transitioning ? 'none' : 'flex' }}
          pointerEvents={transitioning ? 'none' : 'auto'}
          accessibilityElementsHidden={transitioning}
          importantForAccessibility={transitioning ? 'no-hide-descendants' : 'auto'}
          aria-hidden={transitioning}
        >
          {children}
        </View>
        {transitioning ? (
          <View
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: colors.background,
            }}
          >
            <WorkspaceLoading />
          </View>
        ) : null}
      </View>
    </StudyContext.Provider>
  );
}
export function useStudy() {
  const context = useContext(StudyContext);
  if (!context) throw new Error('StudyProvider ausente.');
  const data = useSyncExternalStore(
    context.repository.subscribe,
    context.repository.getSnapshot,
    context.repository.getSnapshot,
  );
  return { ...context, data };
}
