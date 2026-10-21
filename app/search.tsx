import { useMemo, useState } from 'react';
import { TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Card, Empty, Icon, Screen, T, s, type IconName } from '@/components/ui';
import { Choice, Choices } from '@/components/Choice';
import { Touch, Reveal } from '@/components/Motion';
import { useStudy } from '@/hooks/useStudy';
import { searchStudy } from '@/features/study/search';
import type { SearchKind, SearchResult } from '@/types/search';
import { colors } from '@/constants/theme';

const categories: { kind?: SearchKind; label: string }[] = [
  { label: 'Tudo' },
  { kind: 'material', label: 'Materiais' },
  { kind: 'topic', label: 'Assuntos' },
  { kind: 'question', label: 'Questões' },
  { kind: 'flashcard', label: 'Flashcards' },
  { kind: 'studio', label: 'Documentos' },
];
const icons: Record<SearchKind, IconName> = {
  material: 'file-text',
  topic: 'book-open',
  question: 'help-circle',
  flashcard: 'copy',
  studio: 'edit-3',
};
export default function SearchScreen() {
  const { data } = useStudy();
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<SearchKind>();
  const results = useMemo(() => searchStudy(data, query, kind), [data, query, kind]);
  function open(item: SearchResult) {
    if (item.kind === 'studio') {
      router.push({ pathname: '/studio/[id]', params: { id: item.id } });
      return;
    }
    if (item.kind === 'material')
      router.push({ pathname: '/material/[id]', params: { id: item.id } });
    else if (item.kind === 'topic')
      router.push({ pathname: '/topic/[id]', params: { id: item.id } });
    else
      router.push({
        pathname: item.kind === 'question' ? '/questions' : '/flashcards',
        params: {
          topicId: item.topicId,
          ...(item.kind === 'question' ? { questionId: item.id } : { flashcardId: item.id }),
        },
      });
  }
  return (
    <Screen
      title="Encontre sua próxima ideia."
      subtitle="Busque nos conteúdos deste espaço de estudo."
      back
      searchable={false}
      eyebrow="BUSCA"
    >
      <View
        style={[
          s.row,
          { backgroundColor: colors.lavender, borderRadius: 18, paddingHorizontal: 16, gap: 10 },
        ]}
      >
        <Icon name="search" size={20} color={colors.muted} />
        <TextInput
          autoFocus
          accessibilityLabel="Buscar em tudo"
          placeholder="Materiais, assuntos, questões…"
          placeholderTextColor={colors.muted}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          maxLength={150}
          style={[
            s.input,
            { flex: 1, paddingHorizontal: 0, borderWidth: 0, backgroundColor: 'transparent' },
          ]}
        />
        {query ? (
          <Touch
            accessibilityRole="button"
            accessibilityLabel="Limpar busca"
            onPress={() => setQuery('')}
            style={{ minWidth: 36, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon name="x-circle" size={18} color={colors.muted} />
          </Touch>
        ) : null}
      </View>
      <Choices>
        {categories.map((item) => (
          <Choice
            key={item.label}
            label={item.label}
            selected={kind === item.kind}
            onPress={() => setKind(item.kind)}
          />
        ))}
      </Choices>
      {!query.trim() ? (
        <Card>
          <Icon name="compass" size={26} />
          <T style={s.sectionTitle}>Tudo começa com uma curiosidade.</T>
          <T muted>
            Digite uma palavra ou um trecho das suas anotações. A busca também encontra termos sem
            acentos.
          </T>
        </Card>
      ) : (
        <>
          <T muted accessibilityLiveRegion="polite" style={{ fontSize: 12 }}>
            {results.length === 40
              ? 'Primeiros 40 resultados'
              : `${results.length} ${results.length === 1 ? 'resultado' : 'resultados'}`}
          </T>
          {!results.length ? (
            <Empty
              icon="search"
              title="Ainda não encontramos."
              message="Tente uma palavra mais curta ou escolha outra categoria."
            />
          ) : (
            <View style={{ gap: 10 }}>
              {results.map((item) => (
                <Reveal key={`${item.kind}:${item.id}`}>
                  <Card
                    onPress={() => open(item)}
                    label={`Abrir ${item.title}`}
                    style={{ padding: 18 }}
                  >
                    <View style={s.row}>
                      <View style={{ backgroundColor: colors.mint, padding: 12, borderRadius: 15 }}>
                        <Icon name={icons[item.kind]} size={18} />
                      </View>
                      <View style={{ flex: 1, gap: 4 }}>
                        <T numberOfLines={2}>{item.title}</T>
                        <T muted style={{ fontSize: 11 }}>
                          {categories.find((category) => category.kind === item.kind)?.label} ·{' '}
                          {item.detail}
                        </T>
                      </View>
                      <Icon name="chevron-right" size={16} />
                    </View>
                  </Card>
                </Reveal>
              ))}
            </View>
          )}
        </>
      )}
    </Screen>
  );
}
