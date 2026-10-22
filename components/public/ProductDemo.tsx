import { Image, View, StyleSheet, Linking, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BrandLogo } from '@/components/BrandLogo';
import { T, Icon, type IconName } from '@/components/ui';
import { Touch, Reveal } from '@/components/Motion';
import { colors, fonts } from '@/constants/theme';
import { cortexaDemoVideoUrl } from '@/constants/publicExperience';
import { useState } from 'react';

const brainArtwork = require('../../assets/cortexa-brain.png');

function Tag({ children, accent = false }: { children: string; accent?: boolean }) {
  return (
    <View
      style={{
        borderRadius: 7,
        paddingHorizontal: 8,
        paddingVertical: 4,
        alignSelf: 'flex-start',
        backgroundColor: accent ? colors.lavender : colors.neutral,
      }}
    >
      <T
        style={{
          fontSize: 9,
          lineHeight: 14,
          fontFamily: fonts.medium,
          color: accent ? colors.primaryDark : colors.muted,
        }}
      >
        {children}
      </T>
    </View>
  );
}

function MiniProgress({ label, value, muted }: { label: string; value: number; muted?: boolean }) {
  return (
    <View style={{ gap: 7 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
        <T style={{ fontSize: 11 }}>{label}</T>
        <T muted style={{ fontSize: 10 }}>
          {muted ? 'Reforçar' : 'Em construção'}
        </T>
      </View>
      <View style={{ height: 5, borderRadius: 4, backgroundColor: colors.neutral }}>
        <View
          style={{
            width: `${value}%`,
            height: 5,
            borderRadius: 4,
            backgroundColor: muted ? colors.lavenderLine : colors.primary,
          }}
        />
      </View>
    </View>
  );
}

function PreviewContent({ stage }: { stage: number }) {
  if (stage === 0)
    return (
      <View style={{ gap: 18 }}>
        <Tag accent>SEU MATERIAL · ANOTAÇÃO</Tag>
        <T style={styles.previewTitle}>Equilíbrio ácido-base</T>
        <T muted style={{ fontSize: 11, lineHeight: 19 }}>
          Conecte a leitura à prática. Organize os conceitos da aula e retome suas dúvidas no
          próximo estudo.
        </T>
        <View style={{ gap: 9 }}>
          {[95, 100, 78, 90].map((v, i) => (
            <View
              key={i}
              style={{
                height: 5,
                width: `${v}%`,
                backgroundColor: i === 2 ? colors.lavenderLine : colors.neutral,
                borderRadius: 5,
              }}
            />
          ))}
        </View>
        <View
          style={[styles.inline, { borderTopWidth: 1, borderColor: colors.line, paddingTop: 16 }]}
        >
          <Icon name="folder" size={15} />
          <T muted style={{ fontSize: 10 }}>
            Fisiologia / Minhas anotações
          </T>
        </View>
      </View>
    );
  if (stage === 1)
    return (
      <View style={{ gap: 16 }}>
        <View
          style={{
            minHeight: 53,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
          }}
        >
          <Tag accent>MEMÓRIA DE APRENDIZAGEM</Tag>
          <Image
            source={brainArtwork}
            resizeMode="contain"
            fadeDuration={0}
            accessible={false}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={{ width: 58, height: 58, opacity: 0.8 }}
          />
        </View>
        <T style={styles.previewTitle}>As partes se conectam.</T>
        {['Medicina', 'Fisiologia', 'Equilíbrio ácido-base', 'Conceitos em prática'].map(
          (label, index) => (
            <View key={label} style={{ marginLeft: index * 13, gap: 6 }}>
              <View style={styles.inline}>
                <View
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 5,
                    backgroundColor: index === 3 ? colors.primary : colors.lavenderLine,
                  }}
                />
                <T
                  style={{ fontSize: 11, fontFamily: index === 3 ? fonts.semibold : fonts.regular }}
                >
                  {label}
                </T>
              </View>
              {index < 3 ? (
                <View
                  style={{
                    height: 12,
                    width: 1,
                    marginLeft: 3,
                    backgroundColor: colors.lavenderLine,
                  }}
                />
              ) : null}
            </View>
          ),
        )}
      </View>
    );
  if (stage === 2)
    return (
      <View style={{ gap: 19 }}>
        <Tag accent>RECUPERAÇÃO ATIVA</Tag>
        <T style={styles.previewTitle}>O que merece atenção?</T>
        <MiniProgress label="Equilíbrio ácido-base" value={38} muted />
        <MiniProgress label="Fisiologia renal" value={65} />
        <MiniProgress label="Controle cardiovascular" value={78} />
        <T muted style={{ fontSize: 10, lineHeight: 16 }}>
          Acertos, erros e confiança dão contexto às próximas práticas.
        </T>
      </View>
    );
  if (stage === 3)
    return (
      <View style={{ gap: 18 }}>
        <Tag accent>REVISÃO ESPAÇADA</Tag>
        <View style={styles.inline}>
          <Icon name="repeat" size={24} />
          <T style={styles.previewTitle}>Reencontre o essencial.</T>
        </View>
        <View
          style={{
            padding: 18,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.lavenderLine,
            backgroundColor: colors.lavender,
            gap: 9,
          }}
        >
          <T style={{ fontSize: 12, fontFamily: fonts.semibold }}>Equilíbrio ácido-base</T>
          <T muted style={{ fontSize: 11, lineHeight: 18 }}>
            Tente recuperar o conceito antes de reler sua anotação.
          </T>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 4 }}>
          {['Novamente', 'Difícil', 'Bom', 'Fácil'].map((label) => (
            <Tag key={label}>{label}</Tag>
          ))}
        </View>
        <T muted style={{ fontSize: 10 }}>
          Seu retorno ajuda a definir o próximo intervalo.
        </T>
      </View>
    );
  if (stage === 4)
    return (
      <View style={{ gap: 20 }}>
        <Tag accent>SEU PERCURSO</Tag>
        <T style={styles.previewTitle}>Cada prática deixa um sinal.</T>
        <View
          style={{
            height: 100,
            flexDirection: 'row',
            alignItems: 'flex-end',
            gap: 9,
            borderBottomWidth: 1,
            borderColor: colors.line,
            paddingBottom: 8,
          }}
        >
          {[18, 36, 27, 55, 42, 68, 53, 78, 72, 92].map((height, index) => (
            <View
              key={index}
              style={{
                flex: 1,
                height,
                borderRadius: 4,
                backgroundColor: index > 6 ? colors.primary : colors.lavenderLine,
              }}
            />
          ))}
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <T muted style={{ fontSize: 10 }}>
            Atividade ilustrativa
          </T>
          <T style={{ fontSize: 10, color: colors.primaryDark }}>Um passo de cada vez</T>
        </View>
        <T muted style={{ fontSize: 10, lineHeight: 17 }}>
          Evidências do seu estudo, acompanhadas ao longo da formação.
        </T>
      </View>
    );
  return (
    <View style={{ gap: 19 }}>
      <View>
        <T muted style={{ fontSize: 10, marginBottom: 4 }}>
          SEU PRÓXIMO PASSO
        </T>
        <T style={[styles.previewTitle, { fontSize: 22, lineHeight: 29 }]}>
          Seu estudo, conectado.
        </T>
      </View>
      <LinearGradient
        colors={[colors.heroStart, colors.heroEnd]}
        style={{ borderRadius: 17, padding: 19, gap: 11 }}
      >
        <View style={styles.inline}>
          <Icon name="sun" size={17} />
          <T style={{ fontSize: 11, fontFamily: fonts.semibold }}>Hoje, no seu ritmo.</T>
        </View>
        <T style={{ fontSize: 17, lineHeight: 24, fontFamily: fonts.semibold }}>
          Um conceito mais claro. Um passo à frente.
        </T>
        <View style={styles.inline}>
          <View
            style={{ height: 5, width: 45, borderRadius: 3, backgroundColor: colors.primary }}
          />
          <View
            style={{ height: 5, width: 80, borderRadius: 3, backgroundColor: colors.lavenderLine }}
          />
        </View>
      </LinearGradient>
      {(
        [
          { icon: 'book-open', title: 'Retome sua anotação', subtitle: 'Equilíbrio ácido-base' },
          { icon: 'repeat', title: 'Pratique para lembrar', subtitle: 'Questões e revisão' },
        ] as { icon: IconName; title: string; subtitle: string }[]
      ).map((item) => (
        <View key={item.title} style={[styles.inline, { paddingVertical: 6 }]}>
          <View style={{ padding: 10, borderRadius: 12, backgroundColor: colors.neutral }}>
            <Icon name={item.icon} size={16} />
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <T style={{ fontSize: 11, fontFamily: fonts.medium }}>{item.title}</T>
            <T muted style={{ fontSize: 10 }}>
              {item.subtitle}
            </T>
          </View>
          <Icon name="chevron-right" size={14} color={colors.muted} />
        </View>
      ))}
    </View>
  );
}

/** Read-only product composition. Optional real video is fetched only after an explicit press. */
export function ProductDemo({
  stage = -1,
  compact = false,
}: {
  stage?: number;
  compact?: boolean;
}) {
  const [videoError, setVideoError] = useState(false);
  const narrow = useWindowDimensions().width < 600;
  return (
    <View
      testID="product-demo"
      style={[styles.window, { backgroundColor: colors.surface, borderColor: colors.line }]}
    >
      <View style={[styles.windowBar, { borderColor: colors.line }]}>
        <View style={[styles.inline, { gap: 5 }]}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={{ width: 6, height: 6, borderRadius: 6, backgroundColor: colors.lavenderLine }}
            />
          ))}
        </View>
        <BrandLogo size={19} />
        <Icon name="lock" size={11} color={colors.muted} />
      </View>
      <View style={{ flexDirection: 'row', minHeight: compact ? 280 : 370 }}>
        {!narrow && !compact ? (
          <View
            style={{
              width: 51,
              borderRightWidth: 1,
              borderColor: colors.line,
              alignItems: 'center',
              gap: 25,
              paddingTop: 28,
            }}
          >
            {(['grid', 'book-open', 'layers', 'message-circle'] as IconName[]).map((name, i) => (
              <Icon
                key={name}
                name={name}
                size={16}
                color={i === 0 ? colors.primary : colors.muted}
              />
            ))}
          </View>
        ) : null}
        <View
          style={{ flex: 1, padding: compact ? 21 : narrow ? 22 : 28, justifyContent: 'center' }}
        >
          <Reveal key={stage}>
            <PreviewContent stage={stage} />
          </Reveal>
        </View>
      </View>
      <View
        style={{ borderTopWidth: 1, borderColor: colors.line, padding: 10, alignItems: 'center' }}
      >
        <T muted style={{ fontSize: 8, letterSpacing: 1.1, lineHeight: 13 }}>
          DEMONSTRAÇÃO VISUAL · DADOS FICTÍCIOS
        </T>
      </View>
      {cortexaDemoVideoUrl ? (
        <Touch
          accessibilityRole="link"
          accessibilityLabel="Assistir à demonstração real do Cortexa"
          onPress={() => {
            setVideoError(false);
            void Linking.openURL(cortexaDemoVideoUrl!).catch(() => setVideoError(true));
          }}
          style={{ padding: 14, alignItems: 'center' }}
        >
          <T style={{ color: colors.primaryDark, fontSize: 12 }}>Assistir à demonstração</T>
        </Touch>
      ) : null}
      {videoError ? (
        <T accessibilityRole="alert" style={{ padding: 14, fontSize: 12 }}>
          Não foi possível abrir o vídeo. Tente novamente.
        </T>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  window: {
    width: '100%',
    maxWidth: 520,
    borderRadius: 21,
    borderWidth: 1,
    overflow: 'hidden',
    boxShadow: '0px 22px 65px rgba(50, 26, 95, 0.09)',
  },
  windowBar: {
    minHeight: 45,
    paddingHorizontal: 17,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  previewTitle: { fontFamily: fonts.semibold, fontSize: 19, lineHeight: 26, letterSpacing: -0.7 },
});
