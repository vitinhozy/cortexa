import { useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { router, type Href } from 'expo-router';
import { Section, T } from './ui';
import { TopicRow } from './TopicRow';
import { TopicDetails } from './TopicDetails';
import { BottomSheet } from './BottomSheet';
import { useStudy } from '@/hooks/useStudy';
import { topicsToReview } from '@/features/study/insights';
import { useAvailableWidth } from '@/hooks/useAvailableWidth';

export function ReviewPriorities({ compact = false }: { compact?: boolean }) {
  const { data } = useStudy();
  const wide = useAvailableWidth() >= 900 && !compact;
  const [selectedId, setSelectedId] = useState<string>();
  const [visible, setVisible] = useState(false);
  const pendingNavigation = useRef<Href | undefined>(undefined);
  const topics = useMemo(() => topicsToReview(data).slice(0, 3), [data]);
  const selected = topics.find((item) => item.topic.id === selectedId);
  return (
    <View style={{ gap: 14 }}>
      <Section
        title={topics.length ? 'Você precisa revisar' : 'Seus conceitos, em foco'}
        action="Ver conhecimento"
        onPress={() => router.push('/knowledge')}
      />
      <T muted style={{ fontSize: 12, lineHeight: 19 }}>
        {topics.length
          ? 'Comece por estes conceitos. São os que mais precisam de atenção na sua prática.'
          : 'Pratique questões para identificar quais conceitos precisam de mais atenção.'}
      </T>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {topics.map((item) => (
          <View key={item.topic.id} style={{ flexBasis: wide ? '30%' : '100%', flexGrow: 1 }}>
            <TopicRow
              topic={item.topic}
              metric={item.metric}
              compact={compact}
              onPress={() => {
                pendingNavigation.current = undefined;
                setSelectedId(item.topic.id);
                setVisible(true);
              }}
            />
          </View>
        ))}
      </View>
      <BottomSheet
        visible={visible}
        size="large"
        title={selected?.topic.name ?? 'Revisar assunto'}
        onClose={() => {
          pendingNavigation.current = undefined;
          setVisible(false);
        }}
        onDismiss={() => {
          setSelectedId(undefined);
          const destination = pendingNavigation.current;
          pendingNavigation.current = undefined;
          if (destination) router.push(destination);
        }}
      >
        {selected ? (
          <TopicDetails
            topic={selected.topic}
            metric={selected.metric}
            onNavigate={(destination) => {
              pendingNavigation.current = destination;
              setVisible(false);
            }}
          />
        ) : null}
      </BottomSheet>
    </View>
  );
}
