import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWindowDimensions } from 'react-native';
import { GlassTabBar } from '@/components/GlassTabBar';
import { Icon, type IconName } from '@/components/ui';
import { colors, fonts } from '@/constants/theme';
import { useNavigationLayout } from '@/hooks/useNavigationLayout';
import { Reveal } from '@/components/Motion';
import { WorkspaceScreen } from '@/components/WorkspaceScreen';
import type { ComponentProps } from 'react';
const tabScreenLayout: NonNullable<ComponentProps<typeof Tabs>['screenLayout']> = ({
  children,
}) => <WorkspaceScreen>{children}</WorkspaceScreen>;
const tabs: { name: string; title: string; icon: IconName }[] = [
  { name: 'overview', title: 'Visão geral', icon: 'grid' },
  { name: 'study', title: 'Estudar', icon: 'book-open' },
  { name: 'library', title: 'Biblioteca', icon: 'layers' },
  { name: 'ai', title: 'Conversar', icon: 'message-circle' },
  { name: 'profile', title: 'Perfil', icon: 'user' },
];
export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const desktop = width >= 900;
  const { layout } = useNavigationLayout();
  const sideNavigation = desktop && layout === 'left';
  return (
    <Tabs
      screenLayout={tabScreenLayout}
      initialRouteName="overview"
      backBehavior="history"
      tabBar={(props) =>
        sideNavigation ? null : (
          <Reveal>
            <GlassTabBar {...props} />
          </Reveal>
        )
      }
      screenOptions={{
        animation: 'none',
        headerShown: false,
        tabBarPosition: 'bottom',
        tabBarActiveTintColor: colors.primary,
        tabBarActiveBackgroundColor: desktop ? colors.mint : undefined,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          height: 70 + insets.bottom,
          paddingTop: 8,
          paddingBottom: Math.max(insets.bottom, 10),
          paddingHorizontal: Math.max(0, (width - 1000) / 2),
          borderTopColor: colors.line,
          backgroundColor: colors.surface,
        },
        tabBarLabelStyle: { fontSize: 10, fontFamily: fonts.medium, marginTop: 3 },
        tabBarLabelPosition: 'below-icon',
        tabBarShowLabel: true,
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarAccessibilityLabel: tab.title,
            tabBarIcon: ({ color }) => <Icon name={tab.icon} size={21} color={color} />,
          }}
        />
      ))}
    </Tabs>
  );
}
