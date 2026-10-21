import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = 'cortexa:introduction:v1:';
export async function hasSeenIntroduction(id: string): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(PREFIX + id)) === 'seen';
  } catch {
    return false;
  }
}
export async function markIntroductionSeen(id: string): Promise<void> {
  try {
    await AsyncStorage.setItem(PREFIX + id, 'seen');
  } catch {
    // The introduction remains usable if local storage is temporarily unavailable.
  }
}
