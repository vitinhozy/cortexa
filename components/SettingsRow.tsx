import { View } from 'react-native';
import { Icon, T, s, type IconName } from './ui';
import { Touch } from './Motion';
import { colors } from '@/constants/theme';

export function SettingsRow({
  title,
  detail,
  icon,
  onPress,
}: {
  title: string;
  detail?: string;
  icon: IconName;
  onPress: () => void;
}) {
  return (
    <Touch
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={[s.row, { minHeight: 62, paddingVertical: 10 }]}
    >
      <View
        style={{
          width: 36,
          height: 36,
          backgroundColor: colors.mint,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={icon} size={17} />
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <T>{title}</T>
        {detail ? (
          <T muted style={{ fontSize: 11, lineHeight: 16 }}>
            {detail}
          </T>
        ) : null}
      </View>
      <Icon name="chevron-right" size={17} color={colors.muted} />
    </Touch>
  );
}
