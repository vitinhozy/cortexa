import { useState } from 'react';
import { View } from 'react-native';
import {
  Screen,
  Card,
  T,
  Icon,
  Field,
  Button,
  Notice,
  Badge,
  s,
  type IconName,
} from '@/components/ui';
import { useStudy } from '@/hooks/useStudy';
import { colors } from '@/constants/theme';
import { FOLDER_PALETTE } from '@/constants/folderPalette';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { Choice, Choices } from '@/components/Choice';
import { FolderChoice } from '@/components/FolderChoice';
const sources: { name: string; icon: IconName }[] = [
  { name: 'PDF', icon: 'file-text' },
  { name: 'Imagem', icon: 'image' },
  { name: 'Áudio', icon: 'mic' },
  { name: 'Link', icon: 'link' },
  { name: 'Anotações', icon: 'edit-3' },
];
export default function AddMaterialScreen() {
  const { replace } = useAppNavigation();
  const { data, services, repository } = useStudy();
  const [subjectId, setSubjectId] = useState(
    data.user.subjectIds?.[0] ?? data.subjects[0]?.id ?? '',
  );
  const [topicName, setTopicName] = useState('');
  const [folderId, setFolderId] = useState<string>();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function save() {
    if (busy) return;
    setBusy(true);
    try {
      const material = await services.materialService.addNote(title, content, {
        subjectId,
        topicName,
        folderId,
      });
      await repository.flush();
      if (repository.storageError) {
        setError(
          'Anotação adicionada nesta sessão, mas houve uma falha ao gravar no dispositivo. Abra a biblioteca antes de fechar o app.',
        );
        return;
      }
      replace({ pathname: '/material/[id]', params: { id: material.id } });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Não foi possível salvar sua anotação.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <Screen
      title="Adicione uma nova ideia."
      subtitle="Sua biblioteca começa com o que você estuda."
      back
      eyebrow="NOVO MATERIAL"
    >
      <Notice text="Você já pode salvar anotações neste dispositivo. Upload e leitura de PDF, slides, imagens e áudio ainda não estão disponíveis. Nenhum arquivo será apresentado como processado." />
      <View style={s.grid}>
        {sources.map((source) => (
          <Card
            key={source.name}
            style={{
              flexBasis: '44%',
              flexGrow: 1,
              opacity: source.name === 'Anotações' ? 1 : 0.65,
            }}
          >
            <Icon
              name={source.icon}
              color={source.name === 'Anotações' ? colors.primary : colors.muted}
            />
            <T>{source.name}</T>
            <Badge
              label={source.name === 'Anotações' ? 'DISPONÍVEL' : 'EM BREVE'}
              tone={source.name === 'Anotações' ? 'green' : 'neutral'}
            />
          </Card>
        ))}
      </View>
      <Card>
        <T style={s.sectionTitle}>Nova anotação</T>
        <T>Disciplina</T>
        <Choices>
          {data.subjects.map((subject) => (
            <Choice
              key={subject.id}
              label={subject.name}
              selected={subjectId === subject.id}
              onPress={() => setSubjectId(subject.id)}
            />
          ))}
        </Choices>
        <Field
          label="Assunto (opcional)"
          placeholder="Se vazio, usaremos o título"
          value={topicName}
          onChangeText={setTopicName}
          maxLength={100}
        />
        <T>Pasta</T>
        <Choices>
          <FolderChoice
            name="Biblioteca geral"
            selected={!folderId}
            onPress={() => setFolderId(undefined)}
          />
          {data.folders?.map((folder) => (
            <FolderChoice
              key={folder.id}
              name={folder.name}
              color={folder.color ?? FOLDER_PALETTE[0].color}
              selected={folderId === folder.id}
              onPress={() => setFolderId(folder.id)}
            />
          ))}
        </Choices>
        <Field
          label="Título"
          placeholder="Ex.: Pontos importantes da aula"
          value={title}
          onChangeText={setTitle}
          maxLength={100}
        />
        <Field
          label="Anotação"
          multiline
          placeholder="Escreva suas anotações de estudo. Não inclua dados de pacientes."
          value={content}
          onChangeText={setContent}
          maxLength={10000}
        />
        <Button
          title={busy ? 'Salvando...' : 'Salvar anotação'}
          icon="plus"
          onPress={save}
          disabled={busy || !title.trim() || !content.trim()}
        />
      </Card>
      {error ? <Notice text={error} /> : null}
    </Screen>
  );
}
