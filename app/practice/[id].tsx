import { useLocalSearchParams } from 'expo-router';
import { PracticeRunner } from '@/components/practice/PracticeRunner';

export default function PracticeSessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <PracticeRunner key={id} id={id} />;
}
