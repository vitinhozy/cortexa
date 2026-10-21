import { useState } from 'react';
import { View } from 'react-native';
import { Empty, Field, Icon, T, type IconName } from '@/components/ui';
import { AnimatedDisclosure, Touch } from '@/components/Motion';
import { colors, fonts } from '@/constants/theme';
import { normalizePracticeText } from '@/features/study/practice';
import type { StudySource } from '@/types/practice';

const sourceGroups = [
  {
    kind: 'material',
    title: 'Materiais e anotações',
    icon: 'file-text',
    tint: 'lavender',
    accent: 'primaryDark',
    searchTerms: 'arquivos documentos pdf',
  },
  {
    kind: 'flashcard',
    title: 'Flashcards',
    icon: 'layers',
    tint: 'amberLight',
    accent: 'amber',
    searchTerms: 'cartões de memória',
  },
  {
    kind: 'chat',
    title: 'Conversas com a IA',
    icon: 'message-circle',
    tint: 'blueLight',
    accent: 'blue',
    searchTerms: 'chat chats conversas',
  },
  {
    kind: 'studio',
    title: 'Conteúdos do estúdio',
    icon: 'layout',
    tint: 'mint',
    accent: 'teal',
    searchTerms: 'transcrições mapas mentais slides',
  },
  {
    kind: 'quiz',
    title: 'Sessões de prática',
    icon: 'check-square',
    tint: 'rose',
    accent: 'pink',
    searchTerms: 'questões quiz simulados',
  },
] as const satisfies {
  kind: StudySource['kind'];
  title: string;
  icon: IconName;
  tint: keyof typeof colors;
  accent: keyof typeof colors;
  searchTerms: string;
}[];

export function PracticeSourcePicker({
  sources,
  query,
  onQueryChange,
  selectedIds,
  onToggle,
}: {
  sources: StudySource[];
  query: string;
  onQueryChange: (query: string) => void;
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  const [expandedKinds, setExpandedKinds] = useState<StudySource['kind'][]>(() =>
    query.trim() ? sourceGroups.map((group) => group.kind) : [],
  );
  const search = normalizePracticeText(query).trim();
  const groups = sourceGroups
    .map((group) => ({
      ...group,
      items: sources.filter(
        (source) =>
          source.kind === group.kind &&
          normalizePracticeText(
            `${group.title} ${group.searchTerms} ${source.title} ${source.detail}`,
          ).includes(search),
      ),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <View style={{ gap: 14 }}>
      <Field
        label="Buscar nos meus materiais"
        placeholder="Título ou tipo de conteúdo"
        value={query}
        onChangeText={(value) => {
          onQueryChange(value);
          setExpandedKinds(value.trim() ? sourceGroups.map((group) => group.kind) : []);
        }}
      />
      {!sources.length ? (
        <Empty
          title="Sua biblioteca ainda está vazia"
          message="Adicione uma anotação para organizar seus conteúdos e vincular suas questões."
        />
      ) : !groups.length ? (
        <Empty
          title="Nenhum conteúdo encontrado"
          message="Tente outro título ou tipo de conteúdo. Suas seleções continuam salvas."
        />
      ) : (
        groups.map((group) => {
          const expanded = expandedKinds.includes(group.kind);
          const selectedCount = sources.filter(
            (source) => source.kind === group.kind && selectedIds.includes(source.id),
          ).length;
          return (
            <View
              key={group.kind}
              testID={`practice-source-group-${group.kind}`}
              style={{
                borderWidth: 1,
                borderColor: selectedCount ? colors.lavenderLine : colors.line,
                borderRadius: 22,
                backgroundColor: colors.surface,
                overflow: 'hidden',
              }}
            >
              <Touch
                accessibilityRole="button"
                accessibilityLabel={group.title}
                accessibilityHint={`${group.items.length} conteúdos. ${selectedCount} selecionados.`}
                accessibilityState={{ expanded }}
                aria-expanded={expanded}
                onPress={() =>
                  setExpandedKinds((previous) =>
                    previous.includes(group.kind)
                      ? previous.filter((kind) => kind !== group.kind)
                      : [...previous, group.kind],
                  )
                }
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  padding: 16,
                  minHeight: 82,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 13,
                    backgroundColor: colors[group.tint],
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon name={group.icon} size={20} color={colors[group.accent]} />
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <T style={{ fontFamily: fonts.semibold, fontSize: 14 }}>{group.title}</T>
                  <T muted style={{ fontSize: 11 }}>
                    {group.items.length} {group.items.length === 1 ? 'conteúdo' : 'conteúdos'}
                    {selectedCount
                      ? ` · ${selectedCount} ${selectedCount === 1 ? 'selecionado' : 'selecionados'}`
                      : ''}
                  </T>
                </View>
                <Icon
                  name={expanded ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={colors.muted}
                />
              </Touch>
              <AnimatedDisclosure expanded={expanded}>
                <View style={{ paddingHorizontal: 10, paddingBottom: 10, gap: 6 }}>
                  {group.items.map((source) => {
                    const selected = selectedIds.includes(source.id);
                    return (
                      <Touch
                        key={source.id}
                        accessibilityRole="checkbox"
                        accessibilityLabel={`Selecionar ${source.title}`}
                        accessibilityState={{ checked: selected }}
                        aria-checked={selected}
                        onPress={() => onToggle(source.id)}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 12,
                          padding: 14,
                          minHeight: 74,
                          borderRadius: 14,
                          borderWidth: 1,
                          borderColor: selected ? colors.primary : colors.line,
                          backgroundColor: selected ? colors.lavender : colors.surface,
                        }}
                      >
                        <Icon name={selected ? 'check-square' : 'square'} size={20} />
                        <View style={{ flex: 1, gap: 5 }}>
                          <T numberOfLines={3} style={{ fontFamily: fonts.medium, fontSize: 13 }}>
                            {source.title}
                          </T>
                          <T muted style={{ fontSize: 11 }}>
                            {source.detail}
                            {source.simulated ? ' · demonstração' : ''}
                          </T>
                        </View>
                      </Touch>
                    );
                  })}
                </View>
              </AnimatedDisclosure>
            </View>
          );
        })
      )}
    </View>
  );
}
