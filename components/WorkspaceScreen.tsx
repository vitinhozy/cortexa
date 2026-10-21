import type { PropsWithChildren } from 'react';
import { View } from 'react-native';
import { useStudy } from '@/hooks/useStudy';

/** Reset screen drafts per owner while keeping the navigator and its return route alive. */
export function WorkspaceScreen({ children }: PropsWithChildren) {
  const { mode, data, transitioning } = useStudy();
  return (
    <View
      key={`${mode}:${data.user.id}`}
      style={{ flex: 1, display: transitioning ? 'none' : 'flex' }}
    >
      {children}
    </View>
  );
}
