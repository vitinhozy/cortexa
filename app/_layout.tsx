import { Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StudyProvider } from '@/hooks/useStudy';
import { colors } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { MotionProvider } from '@/hooks/useMotion';
import { View, useWindowDimensions } from 'react-native';
import { DesktopSidebar } from '@/components/DesktopSidebar';
import { AppearanceProvider, useAppearance } from '@/hooks/useAppearance';
import { NavigationLayoutProvider, useNavigationLayout } from '@/hooks/useNavigationLayout';
import { Reveal } from '@/components/Motion';
import { LinearGradient } from 'expo-linear-gradient';
import { AppNavigationProvider } from '@/hooks/useAppNavigation';
import type { ComponentProps } from 'react';
import { WorkspaceScreen } from '@/components/WorkspaceScreen';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { isPublicPath } from '@/services/authAccess';

const rootScreenLayout: NonNullable<ComponentProps<typeof Stack>['screenLayout']> = ({
  children,
  route,
}) =>
  route.name === 'index' || route.name === 'account' ? (
    <>{children}</>
  ) : (
    <ProtectedRoute>
      {route.name === '(tabs)' ? <>{children}</> : <WorkspaceScreen>{children}</WorkspaceScreen>}
    </ProtectedRoute>
  );
export default function RootLayout() {
  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  if (!loaded && !error) return null;
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppearanceProvider>
          <StudyProvider>
            <NavigationLayoutProvider>
              <MotionProvider>
                <AppearanceShell />
              </MotionProvider>
            </NavigationLayoutProvider>
          </StudyProvider>
        </AppearanceProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
function AppearanceShell() {
  const { scheme } = useAppearance();
  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <AppNavigator />
    </>
  );
}
function AppNavigator() {
  const { scheme } = useAppearance();
  const { layout } = useNavigationLayout();
  const { user } = useAuth();
  const publicPage = isPublicPath(usePathname());
  const desktop = useWindowDimensions().width >= 900;
  const sideNavigation = !!user && !publicPage && desktop && layout === 'left';
  return (
    <AppNavigationProvider>
      <View style={{ flex: 1, flexDirection: 'row', backgroundColor: colors.background }}>
        {sideNavigation ? (
          <Reveal>
            <DesktopSidebar />
          </Reveal>
        ) : null}
        <View style={{ flex: 1 }}>
          <Stack
            screenLayout={rootScreenLayout}
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
              animation: 'none',
              gestureEnabled: true,
              fullScreenGestureEnabled: true,
              animationMatchesGesture: true,
            }}
          >
            <Stack.Screen name="search" options={{ presentation: 'modal', animation: 'none' }} />
            <Stack.Screen
              name="membership"
              options={{ presentation: 'modal', animation: 'none' }}
            />
            <Stack.Screen
              name="planner"
              options={{
                presentation: 'transparentModal',
                animation: 'none',
                contentStyle: { backgroundColor: 'transparent' },
              }}
            />
          </Stack>
        </View>
        {!publicPage ? (
          <LinearGradient
            pointerEvents="none"
            colors={
              scheme === 'dark'
                ? ['#7C3AED00', '#0B13BD0A', '#7C3AED12']
                : ['#7C3AED00', '#7C3AED0A', '#7C3AED16']
            }
            locations={[0, 0.58, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 210 }}
          />
        ) : null}
      </View>
    </AppNavigationProvider>
  );
}
