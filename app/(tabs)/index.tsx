import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';
import { colors } from '@/constants/theme';
import { hasSeenIntroduction } from '@/services/introductions';

export default function EntryRoute() {
  const [destination, setDestination] = useState<'/onboarding' | '/overview'>();
  useEffect(() => {
    let active = true;
    hasSeenIntroduction('welcome').then((seen) => {
      if (active) setDestination(seen ? '/overview' : '/onboarding');
    });
    return () => {
      active = false;
    };
  }, []);
  return destination ? (
    <Redirect href={destination} />
  ) : (
    <View
      accessibilityLabel="Preparando o Cortexa"
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.background,
      }}
    >
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}
