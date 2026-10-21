import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

export function feedback(kind: 'selection' | 'success' = 'selection') {
  if (Platform.OS === 'web') return;
  const effect =
    kind === 'success'
      ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      : Haptics.selectionAsync();
  // Ausência de Taptic Engine, modo de economia e limitações do aparelho não bloqueiam a ação.
  void effect.catch(() => undefined);
}
