import { View } from 'react-native';
import { colors, fonts } from '@/constants/theme';
import { folderAccent } from '@/constants/folderPalette';
import { Icon, T } from './ui';
import { Touch } from './Motion';

export function FolderChoice({
  name,
  color,
  selected,
  onPress,
  iconOnly = false,
  fullWidth = false,
}: {
  name: string;
  color?: string;
  selected: boolean;
  onPress: () => void;
  iconOnly?: boolean;
  fullWidth?: boolean;
}) {
  const tint = color ?? colors.neutral;
  const accent = color ? folderAccent(color) : colors.muted;
  const compactIcon = iconOnly || fullWidth;
  return (
    <Touch
      accessibilityRole="button"
      accessibilityLabel={name}
      accessibilityHint={compactIcon ? 'Toque para filtrar os materiais desta pasta.' : undefined}
      accessibilityState={{ selected }}
      aria-pressed={selected}
      onPress={onPress}
      style={{
        width: fullWidth ? '100%' : iconOnly ? 56 : undefined,
        height: iconOnly ? 56 : undefined,
        minHeight: fullWidth ? 68 : iconOnly ? 56 : 44,
        flexDirection: fullWidth || !iconOnly ? 'row' : 'column',
        alignItems: 'center',
        justifyContent: fullWidth ? 'flex-start' : 'center',
        gap: fullWidth ? 14 : 8,
        paddingHorizontal: fullWidth ? 12 : iconOnly ? 0 : 12,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: selected ? (color ? accent : colors.primary) : colors.line,
        backgroundColor: selected && !fullWidth ? (color ? tint : colors.lavender) : colors.surface,
      }}
    >
      {iconOnly ? (
        <Icon name="folder" size={25} color={accent} />
      ) : (
        <>
          <View
            style={{
              width: fullWidth ? 42 : 26,
              height: fullWidth ? 42 : 26,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: fullWidth ? 12 : 8,
              backgroundColor: tint,
            }}
          >
            <Icon name="folder" size={fullWidth ? 21 : 15} color={accent} />
          </View>
          <T
            style={{
              flex: fullWidth ? 1 : undefined,
              fontSize: fullWidth ? 14 : 12,
              fontFamily: selected ? fonts.semibold : fonts.regular,
            }}
          >
            {name}
          </T>
        </>
      )}
    </Touch>
  );
}
