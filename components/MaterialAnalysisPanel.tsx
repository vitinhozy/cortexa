import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { router } from 'expo-router';
import { BottomSheet } from './BottomSheet';
import { Badge, Button, Card, Icon, Notice, T, s } from './ui';
import { useStudy } from '@/hooks/useStudy';
import { useAuth } from '@/hooks/useAuth';
import { colors } from '@/constants/theme';
import type { StudyMaterial } from '@/types/domain';
import type { MaterialAnalysisRecord } from '@/types/materialAnalysis';
import { AIError } from '@/services/aiErrors';

export function MaterialAnalysisPanel({ material }: { material: StudyMaterial }) {
  const { data, services, repository } = useStudy();
  const auth = useAuth();
  const service = services.materialAnalysisService;
  const [visible, setVisible] = useState(false);
  const [result, setResult] = useState<MaterialAnalysisRecord>();
  const [busy, setBusy] = useState<'analyze' | 'save'>();
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const active = useRef<AbortController | null>(null);
  useEffect(
    () => () => {
      active.current?.abort();
      active.current = null;
    },
    [],
  );
  const close = () => {
    active.current?.abort();
    active.current = null;
    setVisible(false);
    setBusy(undefined);
  };
  const run = async (operation: 'analyze' | 'save') => {
    if (active.current) return;
    const controller = new AbortController();
    active.current = controller;
    setError('');
    setBusy(operation);
    try {
      const record =
        operation === 'analyze'
          ? await service.analyze(material.id, controller.signal)
          : await service.approve(material.id, result!, controller.signal);
      if (
        operation === 'save' &&
        !(await repository.flush()) &&
        !(await repository.retryPersistence())
      )
        throw new AIError('storage');
      if (active.current !== controller) return;
      setResult(record);
      setSaved(operation === 'save' || material.analysis?.record.id === record.id);
    } catch (reason) {
      if (active.current === controller && !controller.signal.aborted)
        setError(
          reason instanceof Error
            ? reason.message
            : 'Não foi possível analisar agora. Tente novamente.',
        );
    } finally {
      if (active.current === controller) {
        active.current = null;
        setBusy(undefined);
      }
    }
  };
  return (
    <>
      <Card>
        <View style={s.row}>
          <Icon name="git-branch" />
          <T style={s.sectionTitle}>Conceitos do material</T>
        </View>
        <T muted>Identifique as ideias principais e conecte sua anotação ao seu estudo.</T>
        {material.analysis ? (
          <T muted>{material.analysis.conceptIds.length} conceitos revisados neste material.</T>
        ) : null}
        <Button
          title="Analisar conceitos"
          variant="secondary"
          onPress={() => {
            setResult(undefined);
            setSaved(false);
            setError('');
            setVisible(true);
          }}
        />
      </Card>
      <BottomSheet visible={visible} title="Conceitos do material" size="large" onClose={close}>
        <T style={s.sectionTitle}>{material.title}</T>
        {!service.available ? (
          <>
            <Notice
              text={
                data.user.id === 'local'
                  ? 'Entre na sua conta para analisar seus materiais. Sua anotação continua disponível para estudo neste dispositivo.'
                  : 'A análise de materiais ainda não está disponível neste ambiente. Sua anotação continua salva.'
              }
            />
            {data.user.id === 'local' && auth.configured ? (
              <Button
                title="Entrar ou criar conta"
                icon="user"
                variant="secondary"
                onPress={() =>
                  router.push({
                    pathname: '/account',
                    params: { next: `/material/${material.id}` },
                  })
                }
              />
            ) : null}
          </>
        ) : !result ? (
          <>
            <T muted>
              Vamos enviar esta anotação para identificar conceitos e objetivos de aprendizagem.
              Você poderá conferir os trechos de origem antes de salvar.
            </T>
            <Notice text="Use apenas materiais de estudo, sem dados de pacientes. As sugestões geradas precisam da sua revisão." />
            <Button
              title={error ? 'Tentar análise novamente' : 'Analisar esta anotação'}
              disabled={!!busy}
              onPress={() => void run('analyze')}
            />
          </>
        ) : (
          <>
            <Badge
              label={saved ? 'CONCEITOS SALVOS' : 'RASCUNHO PARA REVISÃO'}
              tone={saved ? 'green' : 'amber'}
            />
            <T muted>
              Confira a fidelidade ao material. A análise organiza conteúdo de estudo e não avalia
              seu domínio.
            </T>
            <T>
              {result.analysis.discipline} · {result.analysis.theme}
            </T>
            <T muted>
              Profundidade:{' '}
              {
                { basic: 'básica', intermediate: 'intermediária', advanced: 'avançada' }[
                  result.analysis.complexity
                ]
              }
            </T>
            {result.analysis.topics.length ? (
              <T>Tópicos: {result.analysis.topics.join(' · ')}</T>
            ) : null}
            {result.analysis.learningObjectives.length ? (
              <Card>
                <T style={s.sectionTitle}>Objetivos de aprendizagem</T>
                {result.analysis.learningObjectives.map((objective, index) => (
                  <T key={index}>• {objective}</T>
                ))}
              </Card>
            ) : null}
            {result.analysis.concepts.map((concept) => (
              <Card key={concept.name}>
                <T style={s.sectionTitle}>{concept.name}</T>
                {concept.important ? <Badge label="CONCEITO PRINCIPAL" /> : null}
                <T>{concept.description}</T>
                <T muted>Trecho da sua anotação:</T>
                <T style={{ borderLeftWidth: 3, borderLeftColor: colors.primary, paddingLeft: 12 }}>
                  “{concept.evidenceQuote}”
                </T>
                {concept.prerequisites.length ? (
                  <T muted>Pré-requisitos sugeridos: {concept.prerequisites.join(', ')}</T>
                ) : null}
              </Card>
            ))}
            {result.analysis.limitations.map((limitation, index) => (
              <Notice key={index} text={limitation} />
            ))}
            {result.analysis.status === 'insufficient' ? (
              <T muted>Complemente sua anotação para uma nova análise.</T>
            ) : !saved ? (
              <Button
                title="Conferi e quero salvar os conceitos"
                disabled={!!busy}
                onPress={() => void run('save')}
              />
            ) : (
              <Notice text="Conceitos ligados ao material e disponíveis no seu catálogo de estudo. Seu domínio será estimado conforme você praticar." />
            )}
          </>
        )}
        {busy ? (
          <View
            accessibilityRole="progressbar"
            accessibilityLabel={busy === 'save' ? 'Salvando conceitos' : 'Analisando material'}
            style={[s.row, { gap: 12 }]}
          >
            <ActivityIndicator color={colors.primary} />
            <T muted>{busy === 'save' ? 'Salvando conceitos...' : 'Analisando seu material...'}</T>
          </View>
        ) : null}
        {error ? (
          <View accessibilityLiveRegion="polite">
            <Notice text={error} />
          </View>
        ) : null}
        <Button title={busy ? 'Cancelar' : 'Fechar'} variant="ghost" onPress={close} />
      </BottomSheet>
    </>
  );
}
