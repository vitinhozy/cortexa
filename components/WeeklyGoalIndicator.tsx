import { View } from 'react-native';
import { colors, fonts } from '@/constants/theme';
import { useAvailableWidth } from '@/hooks/useAvailableWidth';
import { Icon, T } from './ui';
import { Touch } from './Motion';

export function WeeklyGoalIndicator({
  minutes,
  goal,
  onPress,
}: {
  minutes: number;
  goal: number;
  onPress?: () => void;
}) {
  const width = useAvailableWidth();
  const progress = goal > 0 ? Math.min(100, Math.max(0, (minutes / goal) * 100)) : 0;
  const label = `Meta semanal: ${minutes} de ${goal} minutos`;
  const compact = width < 600;
  const style = {
    minHeight: 40,
    borderRadius: 13,
    backgroundColor: colors.lavender,
    paddingHorizontal: compact ? 10 : 12,
    paddingVertical: compact ? 9 : 7,
    justifyContent: 'center' as const,
  };

  if (compact) {
    const compactStyle = [
      style,
      {
        width: 40,
        height: 40,
        alignItems: 'center' as const,
        paddingHorizontal: 0,
        paddingVertical: 0,
      },
    ];
    return onPress ? (
      <Touch
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        testID="weekly-goal-indicator"
        style={compactStyle}
      >
        <Icon name="target" size={18} />
      </Touch>
    ) : (
      <View
        accessible
        accessibilityLabel={label}
        testID="weekly-goal-indicator"
        style={compactStyle}
      >
        <Icon name="target" size={18} />
      </View>
    );
  }

  const content = (
    <View style={{ width: 160, gap: 4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Icon name="target" size={13} />
          <T style={{ fontSize: 9, fontFamily: fonts.semibold, letterSpacing: 0.3 }}>
            META SEMANAL
          </T>
        </View>
        <T style={{ fontSize: 10, fontFamily: fonts.semibold, color: colors.primary }}>
          {Math.round(progress)}%
        </T>
      </View>
      <T muted style={{ fontSize: 9, lineHeight: 12 }}>
        {minutes} de {goal} min
      </T>
      <View
        accessibilityRole="progressbar"
        accessibilityLabel={label}
        accessibilityValue={{ min: 0, max: 100, now: Math.round(progress) }}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
        style={{ height: 4, borderRadius: 9, backgroundColor: colors.neutral, overflow: 'hidden' }}
      >
        <View style={{ width: `${progress}%`, height: '100%', backgroundColor: colors.primary }} />
      </View>
    </View>
  );

  return onPress ? (
    <Touch
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      testID="weekly-goal-indicator"
      style={style}
    >
      {content}
    </Touch>
  ) : (
    <View accessible accessibilityLabel={label} testID="weekly-goal-indicator" style={style}>
      {content}
    </View>
  );
}
