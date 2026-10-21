import { Fragment } from 'react';
import { View } from 'react-native';
import { Icon, T } from './ui';
import { Touch } from './Motion';
import { colors, fonts } from '@/constants/theme';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import type { NavigationLocation } from '@/types/navigation';

export function NavigationTrail({ location }: { location: NavigationLocation }) {
  const { dismissTo } = useAppNavigation();
  return (
    <View
      testID="navigation-trail"
      accessibilityLabel={`Você está em: ${location.crumbs.map((crumb) => crumb.label).join(' > ')}`}
      style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 7 }}
    >
      {location.crumbs.map((crumb, index) => (
        <Fragment key={`${index}:${crumb.label}`}>
          {index ? <Icon name="chevron-right" size={13} color={colors.muted} /> : null}
          {crumb.href ? (
            <Touch
              accessibilityRole="button"
              accessibilityLabel={`Ir para ${crumb.label}`}
              onPress={() => crumb.href && dismissTo(crumb.href)}
              style={{ minHeight: 34, justifyContent: 'center', paddingHorizontal: 2 }}
            >
              <T muted style={{ fontSize: 11 }}>
                {crumb.label}
              </T>
            </Touch>
          ) : (
            <T style={{ fontSize: 11, fontFamily: fonts.medium, color: colors.primaryDark }}>
              {crumb.label}
            </T>
          )}
        </Fragment>
      ))}
    </View>
  );
}
