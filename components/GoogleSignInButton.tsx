import { ActivityIndicator } from 'react-native';
import AntDesign from '@expo/vector-icons/AntDesign';
import { Touch } from './Motion';
import { T } from './ui';
import { colors, fonts } from '@/constants/theme';

export function GoogleSignInButton({
  onPress,
  busy = false,
  disabled = false,
}: {
  onPress: () => void;
  busy?: boolean;
  disabled?: boolean;
}) {
  return (
    <Touch
      accessibilityRole="button"
      accessibilityLabel={busy ? 'Abrindo Google...' : 'Continuar com Google'}
      accessibilityState={{ disabled: disabled || busy, busy }}
      disabled={disabled || busy}
      onPress={onPress}
      style={{
        minHeight: 50,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.line,
        backgroundColor: colors.surface,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        paddingHorizontal: 16,
      }}
    >
      {busy ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <AntDesign name="google" size={20} color={colors.ink} accessible={false} />
      )}
      <T style={{ fontFamily: fonts.semibold, fontSize: 14, color: colors.ink }}>
        {busy ? 'Abrindo Google...' : 'Continuar com Google'}
      </T>
    </Touch>
  );
}
