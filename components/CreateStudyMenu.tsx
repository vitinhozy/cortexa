import { router } from 'expo-router';
import { View } from 'react-native';
import { BottomSheet } from './BottomSheet';
import { Touch } from './Motion';
import { Icon, T, s } from './ui';
import { workspaceTools } from '@/constants/tools';
import { colors, fonts, themeTint } from '@/constants/theme';

export function CreateStudyMenu({
  visible,
  onClose,
  materialId,
  sourceId,
}: {
  visible: boolean;
  onClose: () => void;
  materialId?: string;
  sourceId?: string;
}) {
  return (
    <BottomSheet title="Criar material de estudo" visible={visible} onClose={onClose}>
      <T muted>
        Escolha um formato e dê forma às suas ideias. Os editores são locais, sem geração por IA.
      </T>
      <View style={{ gap: 10 }}>
        {workspaceTools
          .filter((tool) =>
            ['flashcards', 'mindmap', 'assessment', 'slides', 'transcript'].includes(tool.id),
          )
          .map((tool) => (
            <Touch
              key={tool.id}
              accessibilityRole="button"
              accessibilityLabel={`Criar ${tool.label}`}
              onPress={() => {
                onClose();
                router.push({
                  pathname: ['flashcards', 'assessment'].includes(tool.id)
                    ? '/compose'
                    : '/studio/edit',
                  params: {
                    kind: tool.id,
                    ...(materialId ? { materialId } : {}),
                    ...(sourceId ? { sourceId } : {}),
                  },
                });
              }}
              style={[
                s.row,
                {
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.line,
                  padding: 16,
                  borderRadius: 18,
                },
              ]}
            >
              <View
                style={{ backgroundColor: themeTint(tool.color), borderRadius: 12, padding: 10 }}
              >
                <Icon name={tool.icon} color={themeTint(tool.ink, '#B69AFF')} size={18} />
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <T style={{ fontFamily: fonts.semibold, fontSize: 13 }}>{tool.label}</T>
                <T muted style={{ fontSize: 11, lineHeight: 17 }}>
                  {tool.detail}
                </T>
              </View>
              <Icon name="chevron-right" size={15} color={colors.muted} />
            </Touch>
          ))}
      </View>
    </BottomSheet>
  );
}
