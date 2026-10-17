import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
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
const sources: { name: string; icon: IconName }[] = [
  { name: 'PDF', icon: 'file-text' },
  { name: 'Imagem', icon: 'image' },
  { name: 'Áudio', icon: 'mic' },
  { name: 'Link', icon: 'link' },
  { name: 'Anotações', icon: 'edit-3' },
];
export default function AddMaterialScreen() {
  const { services } = useStudy();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function save() {
    if (busy) return;
    setBusy(true);
    try {
      const material = await services.materialService.addNote(title, content);
      router.replace({ pathname: '/material/[id]', params: { id: material.id } });
    } catch {
      setError('Preencha os campos para salvar sua anotação.');
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
      <Notice text="Uploads de PDF, imagem, áudio e links estarão disponíveis com as integrações futuras. Nesta versão, você pode salvar anotações locais de demonstração." />
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
        <Badge label="FISIOLOGIA · EQUILÍBRIO ÁCIDO-BASE" />
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
          placeholder="Adicione apenas conteúdo fictício para testar..."
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
