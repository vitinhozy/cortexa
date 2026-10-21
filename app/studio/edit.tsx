import { useRef, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Button, Card, Empty, Field, Notice, Screen, T } from '@/components/ui';
import { useStudy } from '@/hooks/useStudy';
import { validStudioKind } from '@/features/study/studio';
import { workspaceTools } from '@/constants/tools';
import { themeTint } from '@/constants/theme';
import { useAppNavigation } from '@/hooks/useAppNavigation';

export default function StudioEditor() {
  const { dismissTo } = useAppNavigation();
  const {
    kind: parameter,
    id,
    materialId,
    sourceId,
  } = useLocalSearchParams<{
    kind?: string;
    id?: string;
    materialId?: string;
    sourceId?: string;
  }>();
  const { data, services, repository } = useStudy();
  const existing = data.studio?.find((item) => item.id === id);
  const sourceDocument = data.studio?.find((item) => item.id === sourceId);
  const kind = existing?.kind ?? (validStudioKind(parameter) ? parameter : 'mindmap');
  const source = data.materials.find(
    (item) => item.id === (existing?.materialId ?? materialId ?? sourceDocument?.materialId),
  );
  const tool = workspaceTools.find((item) => item.id === kind)!;
  const [title, setTitle] = useState(
    existing?.title ?? sourceDocument?.title ?? source?.title ?? '',
  );
  const [body, setBody] = useState(existing?.body ?? sourceDocument?.body ?? source?.content ?? '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const savedId = useRef(id);
  const locked = useRef(false);
  if (id && !existing)
    return (
      <Screen title="Documento" back backTo="/library">
        <Empty
          title="Documento não encontrado"
          message="Ele pode ter sido removido deste espaço."
        />
      </Screen>
    );
  return (
    <Screen
      title={
        existing ? 'Ajuste suas ideias.' : `Vamos criar: ${tool.label.toLocaleLowerCase('pt-BR')}`
      }
      subtitle="Seu conteúdo, com a sua voz."
      back
      backTo={
        existing
          ? { pathname: '/studio/[id]', params: { id: existing.id } }
          : { pathname: '/studio', params: { kind } }
      }
      eyebrow="EDITOR LOCAL"
    >
      <Card style={{ backgroundColor: themeTint(tool.color), borderColor: themeTint(tool.color) }}>
        <T>
          {kind === 'transcript'
            ? 'Cole ou escreva o texto da aula. Você pode incluir marcações como [00:30]. Não há envio de áudio, transcrição automática nem player nesta etapa.'
            : kind === 'mindmap'
              ? 'Cada bloco vira um ramo. Escreva o nome do ramo na primeira linha e as ideias nas linhas seguintes. Separe os ramos com uma linha em branco.'
              : 'Cada bloco vira um slide. Use a primeira linha como título e as seguintes como conteúdo. Separe os slides com uma linha em branco.'}
        </T>
      </Card>
      <Card>
        <Field
          label="Título do documento"
          value={title}
          onChangeText={setTitle}
          maxLength={100}
          placeholder="Dê um nome à sua ideia"
        />
        <Field
          label="Conteúdo do documento"
          value={body}
          onChangeText={setBody}
          multiline
          maxLength={12000}
          style={{ minHeight: 280 }}
          placeholder={
            kind === 'transcript'
              ? '[00:00] Cole aqui a sua transcrição...'
              : 'Primeiro tema\nUma ideia importante\nOutra conexão\n\nSegundo tema\nPróxima ideia'
          }
        />
        <T muted style={{ fontSize: 11 }}>
          {body.length}/12.000 caracteres ·{' '}
          {kind === 'transcript' ? 'texto inserido por você' : 'até 24 blocos'}
        </T>
      </Card>
      {sourceDocument || source ? (
        <Notice
          text={`Origem: ${sourceDocument?.title ?? source?.title}. O texto foi copiado para edição, sem geração ou revisão por IA.`}
        />
      ) : null}
      {error ? <Notice text={error} /> : null}
      <Button
        title={busy ? 'Salvando...' : 'Salvar documento'}
        icon="check"
        disabled={busy}
        onPress={async () => {
          if (locked.current) return;
          locked.current = true;
          setBusy(true);
          setError('');
          try {
            const item = await services.studioService.save({
              id: savedId.current,
              kind,
              title,
              body,
              materialId: source?.id,
            });
            savedId.current = item.id;
            await repository.flush();
            if (repository.storageError)
              throw new Error(
                'Documento disponível nesta sessão, mas não foi possível gravar no dispositivo.',
              );
            dismissTo({ pathname: '/studio/[id]', params: { id: item.id } });
          } catch (reason) {
            setError(reason instanceof Error ? reason.message : 'Não foi possível salvar.');
          } finally {
            locked.current = false;
            setBusy(false);
          }
        }}
      />
    </Screen>
  );
}
