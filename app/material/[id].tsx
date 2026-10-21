import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { Screen, Card, T, Button, Badge, Empty, Notice, Icon, s } from '@/components/ui';
import { useStudy } from '@/hooks/useStudy';
import { formatDate } from '@/utils/date';
import { useEffect, useState } from 'react';
import { Choices } from '@/components/Choice';
import { FolderChoice } from '@/components/FolderChoice';
import { FOLDER_PALETTE } from '@/constants/folderPalette';
import { CreateStudyMenu } from '@/components/CreateStudyMenu';
import { MaterialAnalysisPanel } from '@/components/MaterialAnalysisPanel';
export default function MaterialScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, services, mode } = useStudy();
  const [message, setMessage] = useState('');
  const [create, setCreate] = useState(false);
  useEffect(() => {
    void services.folderService.openMaterial(id);
  }, [id, services]);
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
      pathname: '/ai',
      params: { materialId: id, topicId: material.topicId, ...(prompt ? { prompt } : {}) },
    });
  return (
    <Screen
      title={material.title}
      subtitle={`${data.subjects.find((subject) => subject.id === material.subjectId)?.name ?? 'Material'} · Sua biblioteca`}
      eyebrow="CONHECIMENTO COM CONTEXTO"
      back
    >
      <Button title="Criar material de estudo" icon="plus" onPress={() => setCreate(true)} />
      <CreateStudyMenu visible={create} onClose={() => setCreate(false)} materialId={id} />
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
        <Badge
          label={material.content ? 'SALVO NESTE DISPOSITIVO' : 'MATERIAL FICTÍCIO · SEM ARQUIVO'}
        />
      </Card>
      {material.content ? (
        <Card>
          <T style={s.sectionTitle}>Sua anotação</T>
          <T style={{ lineHeight: 25 }}>{material.content}</T>
        </Card>
      ) : (
        <Notice text="Este material é fictício. Não há um PDF real associado; as ações abaixo usam conteúdos de demonstração." />
      )}
      <Card>
        <Button
          title={material.favorite ? 'Remover dos favoritos' : 'Favoritar material'}
          icon="star"
          variant="secondary"
          onPress={() => {
            void services.folderService.favoriteMaterial(id);
          }}
        />
        <T style={s.sectionTitle}>Mover para pasta</T>
        <Choices>
          <FolderChoice
            name="Biblioteca geral"
            selected={!material.folderId}
            onPress={async () => {
              try {
                await services.folderService.moveMaterial(id, undefined);
                setMessage('Organização atualizada.');
              } catch {
                setMessage('Não foi possível mover o material.');
              }
            }}
          />
          {(data.folders ?? []).map((folder) => (
            <FolderChoice
              key={folder.id}
              name={folder.name}
              color={folder.color ?? FOLDER_PALETTE[0].color}
              selected={material.folderId === folder.id}
              onPress={async () => {
                try {
                  await services.folderService.moveMaterial(id, folder.id);
                  setMessage('Organização atualizada.');
                } catch {
                  setMessage('Não foi possível mover o material.');
                }
              }}
            />
          ))}
        </Choices>
      </Card>
      {message ? <Notice text={message} /> : null}
      {mode === 'personal' ? (
        <>
          {material.content && material.type === 'Anotações' ? (
            <MaterialAnalysisPanel key={material.id} material={material} />
          ) : null}
          <Notice text="Você pode criar mapas, slides, questões e flashcards nos editores locais. A geração automática desses conteúdos será disponibilizada em uma próxima etapa." />
          <Button
            title="Estudar anotação"
            onPress={() =>
              router.push({
                pathname: '/session',
                params: { topicId: material.topicId, materialId: material.id },
              })
            }
          />
        </>
      ) : (
        <>
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
            onPress={() =>
              router.push({ pathname: '/planner', params: { topicId: material.topicId } })
            }
          />
          <T muted style={{ fontSize: 11, textAlign: 'center' }}>
            Questões e flashcards abrem o banco existente do assunto. A geração real será integrada
            depois.
          </T>
        </>
      )}
    </Screen>
  );
}
