import { Image, Text, View } from 'react-native';
import { colors, fonts } from '@/constants/theme';

export function BrandLogo({ size = 32, wordmark = true }: { size?: number; wordmark?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
      <View
        accessible={false}
        style={{
          width: size,
          height: size,
        }}
      >
        <Image
          source={require('../assets/cortexa-mark.png')}
          resizeMode="contain"
          accessible={false}
          style={{ width: size, height: size }}
        />
      </View>
      {wordmark ? (
        <Text
          style={{
            fontFamily: fonts.semibold,
            fontSize: size * 0.66,
            letterSpacing: -0.7,
            color: colors.ink,
          }}
        >
          Cortexa
        </Text>
      ) : null}
    </View>
  );
}
