import { useLocalSearchParams } from 'expo-router';
import { Empty, Screen } from '@/components/ui';
import { TopicDetails } from '@/components/TopicDetails';
import { useStudy } from '@/hooks/useStudy';

export default function TopicScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data } = useStudy();
  const topic = data.topics.find((item) => item.id === id);
  const metric = data.metrics.find((item) => item.topicId === id);
  if (!topic || !metric)
    return (
      <Screen title="Assunto indisponível" back backTo="/knowledge">
        <Empty
          title="Assunto não encontrado"
          message="Escolha um assunto pelo mapa de conhecimento."
        />
      </Screen>
    );
  return (
    <Screen
      title={topic.name}
      subtitle={topic.unit}
      back
      backTo="/knowledge"
      eyebrow="SEU MAPA, MAIS DE PERTO"
    >
      <TopicDetails topic={topic} metric={metric} />
    </Screen>
  );
}
