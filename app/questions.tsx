import { useLocalSearchParams } from 'expo-router';
import { PracticePreparation } from '@/components/practice/PracticePreparation';

export default function QuestionsScreen() {
  const params = useLocalSearchParams<{
    topicId?: string;
    kind?: string;
    questionId?: string;
    conceptIds?: string;
    sourceId?: string;
  }>();
  return (
    <PracticePreparation
      key={`${params.topicId ?? ''}:${params.questionId ?? ''}:${params.kind ?? ''}:${params.conceptIds ?? ''}:${params.sourceId ?? ''}`}
      {...params}
    />
  );
}
