export type AppearanceScheme = 'light' | 'dark';

const lightPalette = {
  background: '#F9FAFB',
  surface: '#FFFFFF',
  ink: '#0A0A0F',
  muted: '#687083',
  line: '#E7E8EE',
  primary: '#7C3AED',
  primaryDark: '#5321A8',
  lavender: '#F1EAFE',
  lavenderLine: '#E2D3FB',
  mint: '#E7F4EF',
  teal: '#397B69',
  lime: '#F1EAFE',
  amber: '#92702C',
  amberLight: '#FFF3CF',
  red: '#B04F71',
  redLight: '#FBE5EE',
  blue: '#6A52B5',
  blueLight: '#F0EBFA',
  violet: '#7C3AED',
  pink: '#A84F81',
  rose: '#FBEAF3',
  peach: '#FFF0E7',
  orange: '#A5633F',
  neutral: '#F0F0F5',
  heroStart: '#F0E7FF',
  heroEnd: '#FBF5FF',
} as const;

const darkPalette: Record<keyof typeof lightPalette, string> = {
  background: '#0A0A0F',
  surface: '#15141B',
  ink: '#F5F2FA',
  muted: '#A9A3B4',
  line: '#292631',
  primary: '#7C3AED',
  primaryDark: '#B69AFF',
  lavender: '#211832',
  lavenderLine: '#3A2A58',
  mint: '#211832',
  teal: '#B69AFF',
  lime: '#211832',
  amber: '#B69AFF',
  amberLight: '#211832',
  red: '#C4A8FF',
  redLight: '#211832',
  blue: '#2563EB',
  blueLight: '#111B36',
  violet: '#7C3AED',
  pink: '#B69AFF',
  rose: '#211832',
  peach: '#211832',
  orange: '#B69AFF',
  neutral: '#17151D',
  heroStart: '#17113A',
  heroEnd: '#101A35',
};

let activePalette: Record<keyof typeof lightPalette, string> = lightPalette;
export function setAppearancePalette(scheme: AppearanceScheme) {
  activePalette = scheme === 'dark' ? darkPalette : lightPalette;
}

export function themeTint(lightColor: string, darkColor = '#211832') {
  return activePalette === darkPalette ? darkColor : lightColor;
}

export function readableAccentText(color: string) {
  if (activePalette !== darkPalette) return color;
  const purpleTextColors = [
    darkPalette.primary,
    darkPalette.primaryDark,
    darkPalette.violet,
    darkPalette.pink,
    darkPalette.amber,
    darkPalette.red,
    darkPalette.teal,
    darkPalette.orange,
  ];
  return purpleTextColors.includes(color) ? '#B8B4BF' : color;
}

export const colors = new Proxy(lightPalette, {
  get(_target, property) {
    return typeof property === 'string'
      ? activePalette[property as keyof typeof lightPalette]
      : undefined;
  },
});

export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
};
