import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type PropsWithChildren,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { repository, services } from '@/services';
const StudyContext = createContext({ repository, services });
export function StudyProvider({ children }: PropsWithChildren) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let active = true;
    repository.hydrate(AsyncStorage).finally(() => {
      if (active) setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);
  return (
    <StudyContext.Provider value={{ repository, services }}>
      {ready ? children : null}
    </StudyContext.Provider>
  );
}
export function useStudy() {
  const context = useContext(StudyContext);
  const data = useSyncExternalStore(
    context.repository.subscribe,
    context.repository.getSnapshot,
    context.repository.getSnapshot,
  );
  return { data, services: context.services, repository: context.repository };
}
