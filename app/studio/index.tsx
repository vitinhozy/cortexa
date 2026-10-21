import { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Badge, Button, Card, Empty, Icon, Screen, T, s } from '@/components/ui';
import { Reveal } from '@/components/Motion';
import { CreateStudyMenu } from '@/components/CreateStudyMenu';
import { useStudy } from '@/hooks/useStudy';
import { validStudioKind } from '@/features/study/studio';
import { workspaceTools } from '@/constants/tools';
import { colors, fonts, themeTint } from '@/constants/theme';
import { formatDate } from '@/utils/date';

export default function StudioScreen() {
  const { kind: parameter } = useLocalSearchParams<{ kind?: string }>();
  const kind = validStudioKind(parameter) ? parameter : 'mindmap';
  const tool = workspaceTools.find((item) => item.id === kind)!;
  const { data } = useStudy();
  const [menu, setMenu] = useState(false);
  const documents = [...(data.studio ?? [])]
    .filter((item) => item.kind === kind)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return (
    <Screen
      title={tool.label}
      subtitle={tool.detail}
      eyebrow="SEU ESTÚDIO CRIATIVO"
      back
      backTo="/library"
    >
      <Reveal key={kind} variant="inflate">
        <Card
          style={{
            backgroundColor: themeTint(tool.color),
            borderColor: themeTint(tool.color),
            padding: 26,
          }}
        >
          <View style={s.row}>
            <View
              style={{
                padding: 14,
                backgroundColor: themeTint('#FFFFFFBB', '#2A2040'),
                borderRadius: 18,
              }}
            >
              <Icon name={tool.icon} color={themeTint(tool.ink, '#B69AFF')} size={27} />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <T
                style={{
                  fontFamily: fonts.semibold,
                  fontSize: 19,
                  color: themeTint(tool.ink, '#B69AFF'),
                }}
              >
                {kind === 'transcript'
                  ? 'Uma aula, muitas ideias.'
                  : kind === 'mindmap'
                    ? 'Enxergue as conexões.'
                    : 'Uma ideia por vez.'}
              </T>
              <T muted style={{ fontSize: 12 }}>
                {kind === 'transcript'
                  ? 'Cole uma transcrição que você já tenha. Áudio automático ainda não está disponível.'
                  : 'Escreva, organize e edite. Seu conteúdo fica salvo neste dispositivo.'}
              </T>
            </View>
          </View>
          <Button
            title={
              kind === 'transcript'
                ? 'Adicionar transcrição'
                : kind === 'mindmap'
                  ? 'Criar mapa mental'
                  : 'Criar apresentação'
            }
            icon="plus"
            onPress={() => router.push({ pathname: '/studio/edit', params: { kind } })}
          />
        </Card>
      </Reveal>
      <View style={[s.row, { justifyContent: 'space-between' }]}>
        <T style={s.sectionTitle}>Seus documentos</T>
        <Badge
          label={`${documents.length} ${documents.length === 1 ? 'DOCUMENTO' : 'DOCUMENTOS'}`}
          tone="neutral"
        />
      </View>
      {documents.length ? (
        <View style={{ gap: 12 }}>
          {documents.map((item) => (
            <Card
              key={item.id}
              label={`Abrir ${item.title}`}
              onPress={() => router.push({ pathname: '/studio/[id]', params: { id: item.id } })}
            >
              <View style={s.row}>
                <View
                  style={{ backgroundColor: themeTint(tool.color), padding: 12, borderRadius: 14 }}
                >
                  <Icon name={tool.icon} color={themeTint(tool.ink, '#B69AFF')} />
                </View>
                <View style={{ flex: 1, gap: 5 }}>
                  <T style={{ fontFamily: fonts.semibold }}>{item.title}</T>
                  <T muted style={{ fontSize: 11 }}>
                    Editado em {formatDate(item.updatedAt)} · local
                  </T>
                </View>
                <Icon name="chevron-right" size={16} color={colors.muted} />
              </View>
            </Card>
          ))}
        </View>
      ) : (
        <Empty
          title="Espaço para sua próxima ideia"
          message="Crie seu primeiro documento. Você pode voltar para editar quando quiser."
          icon={tool.icon}
        />
      )}
      <Button title="Criar outro tipo de material" variant="ghost" onPress={() => setMenu(true)} />
      <CreateStudyMenu visible={menu} onClose={() => setMenu(false)} />
    </Screen>
  );
}
