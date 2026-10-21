import { View } from 'react-native';
import { T } from './ui';
import { colors, fonts, themeTint } from '@/constants/theme';
import { passwordStrength } from '@/utils/passwordStrength';

export function PasswordStrength({ password }: { password: string }) {
  const level = passwordStrength(password);
  const label = ['Digite uma senha', 'Senha fraca', 'Senha média', 'Senha forte'][level];
  const color = [
    colors.muted,
    themeTint('#B91C1C', '#FCA5A5'),
    themeTint('#966500', '#FCD34D'),
    themeTint('#15803D', '#86EFAC'),
  ][level];
  return (
    <View style={{ gap: 7 }}>
      <View
        accessibilityRole="progressbar"
        accessibilityLabel="Força da senha"
        accessibilityValue={{ min: 0, max: 3, now: level, text: label }}
        aria-valuemin={0}
        aria-valuemax={3}
        aria-valuenow={level}
        aria-valuetext={label}
        style={{ flexDirection: 'row', gap: 5 }}
      >
        {[1, 2, 3].map((segment) => (
          <View
            key={segment}
            style={{
              flex: 1,
              height: 5,
              borderRadius: 3,
              backgroundColor: segment <= level ? color : colors.line,
            }}
          />
        ))}
      </View>
      <T accessibilityLiveRegion="polite" style={{ color, fontFamily: fonts.medium, fontSize: 12 }}>
        {label}
      </T>
      <T muted style={{ fontSize: 11, lineHeight: 17 }}>
        Use pelo menos 8 caracteres. Prefira uma senha longa e única.
      </T>
    </View>
  );
}
