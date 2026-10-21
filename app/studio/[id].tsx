import { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { Badge, Button, Empty, Notice, Screen, T } from '@/components/ui';
import { BottomSheet } from '@/components/BottomSheet';
import { StudyDocumentView } from '@/components/StudyDocumentView';
import { CreateStudyMenu } from '@/components/CreateStudyMenu';
import { useStudy } from '@/hooks/useStudy';
import { formatDate } from '@/utils/date';

export default function DocumentScreen() {
  const { dismissTo, replace } = useAppNavigation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, services, repository } = useStudy();
  const [remove, setRemove] = useState(false);
  const [menu, setMenu] = useState(false);
  const [error, setError] = useState('');
  const document = data.studio?.find((item) => item.id === id);
  if (!document)
    return (
      <Screen title="Documento" back backTo="/library">
        <Empty
          title="Documento não encontrado"
          message="Volte ao estúdio e escolha outro documento."
        />
      </Screen>
    );
  return (
    <Screen
      title={document.title}
      subtitle={`Seu conteúdo · editado em ${formatDate(document.updatedAt)}`}
      back
      backTo={{ pathname: '/studio', params: { kind: document.kind } }}
      eyebrow={
        document.kind === 'mindmap'
          ? 'MAPA MENTAL'
          : document.kind === 'slides'
            ? 'APRESENTAÇÃO'
            : 'TRANSCRIÇÃO EM TEXTO'
      }
    >
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        <Button
          title="Editar documento"
          icon="edit-3"
          small
          variant="secondary"
          onPress={() => router.push({ pathname: '/studio/edit', params: { id } })}
        />
        <Button
          title="Criar material de estudo"
          icon="plus"
          small
          variant="secondary"
          onPress={() => setMenu(true)}
        />
        <Button
          title="Excluir documento"
          icon="trash-2"
          small
          variant="ghost"
          onPress={() => setRemove(true)}
        />
      </View>
      <Badge label="CONTEÚDO INSERIDO POR VOCÊ · SEM IA" tone="neutral" />
      <StudyDocumentView key={document.updatedAt} document={document} />
      <Button title="Voltar à Biblioteca" variant="ghost" onPress={() => replace('/library')} />
      <CreateStudyMenu
        visible={menu}
        onClose={() => setMenu(false)}
        materialId={document.materialId}
        sourceId={id}
      />
      <BottomSheet
        visible={remove}
        onClose={() => setRemove(false)}
        title="Excluir este documento?"
      >
        <T>“{document.title}” será removido deste espaço. O material de origem será preservado.</T>
        {error ? <Notice text={error} /> : null}
        <Button
          title="Confirmar exclusão"
          onPress={async () => {
            await services.studioService.remove(id);
            await repository.flush();
            if (repository.storageError)
              setError('Não foi possível confirmar a gravação no dispositivo.');
            else dismissTo('/library');
          }}
        />
        <Button title="Manter documento" variant="ghost" onPress={() => setRemove(false)} />
      </BottomSheet>
    </Screen>
  );
}
