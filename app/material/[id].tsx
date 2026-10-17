import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { Screen, Card, T, Button, Badge, Empty, Notice, Icon, s } from '@/components/ui';
import { useStudy } from '@/hooks/useStudy';
import { formatDate } from '@/utils/date';
export default function MaterialScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data } = useStudy();
  const material = data.materials.find((m) => m.id === id);
  if (!material)
    return (
      <Screen title="Material" back>
        <Empty
          title="Material não encontrado"
          message="Volte à biblioteca e escolha outro material."
        />
      </Screen>
    );
  const chat = (prompt?: string) =>
    router.push({
      pathname: '/(tabs)/ai',
      params: { materialId: id, topicId: material.topicId, ...(prompt ? { prompt } : {}) },
    });
  return (
    <Screen
      title={material.title}
      subtitle="Fisiologia · Sua biblioteca"
      eyebrow="CONHECIMENTO COM CONTEXTO"
      back
    >
      <Card>
        <View style={s.row}>
          <Icon name="file-text" size={34} />
          <View style={{ gap: 5 }}>
            <Badge label={material.type} />
            <T muted>
              {material.pages} páginas · {formatDate(material.createdAt)}
            </T>
          </View>
        </View>
        <Badge label={material.content ? 'SALVO NESTE DISPOSITIVO' : 'PROCESSAMENTO SIMULADO'} />
      </Card>
      {material.content ? (
        <Card>
          <T style={s.sectionTitle}>Sua anotação</T>
          <T style={{ lineHeight: 25 }}>{material.content}</T>
        </Card>
      ) : (
        <Notice text="Este material é fictício. Não há um PDF real associado; as ações abaixo usam conteúdos de demonstração." />
      )}
      <Button title="Conversar com material" icon="message-circle" onPress={() => chat()} />
      <Button
        title="Gerar resumo"
        icon="align-left"
        variant="secondary"
        onPress={() => chat(`Resuma o material ${material.title}`)}
      />
      <Button
        title="Gerar questões · demonstração"
        icon="check-square"
        variant="secondary"
        onPress={() =>
          router.push({ pathname: '/questions', params: { topicId: material.topicId } })
        }
      />
      <Button
        title="Gerar flashcards · demonstração"
        icon="layers"
        variant="secondary"
        onPress={() =>
          router.push({ pathname: '/flashcards', params: { topicId: material.topicId } })
        }
      />
      <Button
        title="Criar plano de revisão"
        icon="calendar"
        variant="secondary"
        onPress={() => router.push({ pathname: '/planner', params: { topicId: material.topicId } })}
      />
      <T muted style={{ fontSize: 11, textAlign: 'center' }}>
        Questões e flashcards abrem o banco existente do assunto. A geração real será integrada
        depois.
      </T>
    </Screen>
  );
}
