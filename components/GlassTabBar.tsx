import { Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Touch } from './Motion';
import { T } from './ui';
import { colors, fonts } from '@/constants/theme';
import { useAppearance } from '@/hooks/useAppearance';
import { useNavigationLayout } from '@/hooks/useNavigationLayout';
import { NavigationLayoutToggle } from './NavigationLayoutToggle';

export function GlassTabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  const { scheme } = useAppearance();
  const { layout } = useNavigationLayout();
  const desktop = useWindowDimensions().width >= 900;
  return (
    <View
      style={{
        backgroundColor: colors.background,
        paddingHorizontal: 12,
        paddingTop: 7,
        paddingBottom: Math.max(10, insets.bottom),
        position: 'relative',
        overflow: 'visible',
      }}
    >
      <LinearGradient
        pointerEvents="none"
        colors={
          scheme === 'dark'
            ? ['#7C3AED00', '#0B13BD18', '#7C3AED24']
            : ['#7C3AED00', '#7C3AED12', '#7C3AED24']
        }
        locations={[0, 0.6, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ position: 'absolute', left: 0, right: 0, bottom: -12, height: 230 }}
      />
      <View style={[styles.shell, { backgroundColor: colors.surface, borderColor: colors.line }]}>
        {Platform.OS !== 'android' ? (
          <BlurView
            pointerEvents="none"
            tint={scheme === 'dark' ? 'dark' : 'light'}
            intensity={65}
            style={StyleSheet.absoluteFill}
          />
        ) : null}
        <View style={styles.items}>
          {desktop && layout === 'bottom' ? (
            <>
              <NavigationLayoutToggle compact />
              <View
                style={{
                  width: 1,
                  height: 34,
                  alignSelf: 'center',
                  marginHorizontal: 3,
                  backgroundColor: scheme === 'dark' ? '#5B5664' : '#E7E8EE',
                }}
              />
            </>
          ) : null}
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            if (route.name === 'index') return null;
            const focused = state.index === index;
            const color = focused ? colors.primaryDark : colors.muted;
            return (
              <Touch
                key={route.key}
                accessibilityRole="tab"
                accessibilityLabel={options.tabBarAccessibilityLabel ?? options.title}
                accessibilityState={{ selected: focused }}
                aria-selected={focused}
                onPress={() => {
                  const event = navigation.emit({
                    type: 'tabPress',
                    target: route.key,
                    canPreventDefault: true,
                  });
                  if (!focused && !event.defaultPrevented)
                    navigation.navigate(route.name, route.params);
                }}
                onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
                style={[styles.item, focused && { backgroundColor: colors.lavender }]}
              >
                {options.tabBarIcon?.({ focused, color, size: 21 })}
                <T
                  style={{
                    fontSize: 10,
                    lineHeight: 14,
                    fontFamily: focused ? fonts.semibold : fonts.medium,
                    color,
                  }}
                >
                  {options.title ?? route.name}
                </T>
              </Touch>
            );
          })}
        </View>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  shell: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    overflow: 'hidden',
    borderRadius: 28,
    borderCurve: 'continuous',
    borderWidth: 1,
  },
  items: { flexDirection: 'row', padding: 5, gap: 3 },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
    gap: 4,
    borderRadius: 22,
    borderCurve: 'continuous',
  },
});
