import type { PropsWithChildren } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect, useGlobalSearchParams, usePathname } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { colors } from '@/constants/theme';
import { requestedStudyPath } from '@/services/authAccess';

/** Block rendering (and effects) of private screens until Auth validates the user. */
export function ProtectedRoute({ children }: PropsWithChildren) {
  const { ready, user } = useAuth();
  const pathname = usePathname();
  const params = useGlobalSearchParams();
  if (!ready)
    return (
      <View accessibilityLabel="Verificando acesso" style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  if (!user)
    return (
      <Redirect
        href={{ pathname: '/account', params: { next: requestedStudyPath(pathname, params) } }}
      />
    );
  return <>{children}</>;
}
