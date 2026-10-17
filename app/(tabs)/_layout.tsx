import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWindowDimensions } from 'react-native';
import { Icon, type IconName } from '@/components/ui';
import { colors, fonts } from '@/constants/theme';
const tabs: { name: string; title: string; icon: IconName }[] = [
  { name: 'index', title: 'Início', icon: 'home' },
  { name: 'study', title: 'Estudar', icon: 'book-open' },
  { name: 'library', title: 'Biblioteca', icon: 'layers' },
  { name: 'ai', title: 'IA', icon: 'zap' },
  { name: 'profile', title: 'Perfil', icon: 'user' },
];
export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          height: 70 + insets.bottom,
          paddingTop: 8,
          paddingBottom: Math.max(insets.bottom, 10),
          paddingHorizontal: Math.max(0, (width - 1000) / 2),
          borderTopColor: colors.line,
          backgroundColor: '#FFFFFF',
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
