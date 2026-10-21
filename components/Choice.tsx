import { Platform, View } from 'react-native';
import { Touch } from './Motion';
import { T } from './ui';
import { colors } from '@/constants/theme';

export function Choice({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Touch
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      {...(Platform.OS === 'web' ? { 'aria-pressed': selected } : {})}
      onPress={onPress}
      style={{
        minHeight: 44,
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: selected ? colors.primary : colors.line,
        backgroundColor: selected ? colors.mint : colors.surface,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
      }}
    >
      <T style={{ fontSize: 12, color: selected ? colors.primaryDark : colors.muted }}>{label}</T>
    </Touch>
  );
}
export function Choices({ children }: { children: React.ReactNode }) {
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{children}</View>;
}
