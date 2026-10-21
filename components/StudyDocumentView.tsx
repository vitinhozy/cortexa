import { useEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Button, Card, Icon, T, s } from './ui';
import { Reveal } from './Motion';
import { colors, fonts } from '@/constants/theme';
import { studyBlocks } from '@/features/study/studio';
import type { StudioDocument } from '@/types/studio';

const palette = [
  colors.blueLight,
  colors.mint,
  colors.rose,
  colors.amberLight,
  colors.lavender,
  colors.peach,
];
export function StudyDocumentView({ document }: { document: StudioDocument }) {
  const [slide, setSlide] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [mapViewport, setMapViewport] = useState(0);
  const mapRef = useRef<ScrollView>(null);
  const blocks = studyBlocks(document.body);
  const mapWidth = Math.max(mapViewport, Math.max(560, blocks.length * 205) * zoom);
  useEffect(() => {
    mapRef.current?.scrollTo({ x: Math.max(0, (mapWidth - mapViewport) / 2), animated: false });
  }, [mapWidth, mapViewport]);
  if (document.kind === 'transcript')
    return (
      <View style={{ gap: 12 }}>
        {document.body
          .split(/\n\s*\n/)
          .filter(Boolean)
          .map((text, index) => (
            <Card
              key={index}
              style={{ borderLeftWidth: 3, borderLeftColor: palette[index % palette.length] }}
            >
              <View style={[s.row, { alignItems: 'flex-start' }]}>
                <T style={{ color: colors.teal, fontSize: 11 }}>
                  {String(index + 1).padStart(2, '0')}
                </T>
                <T selectable style={{ flex: 1, lineHeight: 27 }}>
                  {text}
                </T>
              </View>
            </Card>
          ))}
      </View>
    );
  if (document.kind === 'slides') {
    const current = blocks[Math.min(slide, blocks.length - 1)];
    return (
      <View style={{ gap: 18 }}>
        <Reveal key={slide} variant="inflate">
          <LinearGradient
            colors={[palette[slide % palette.length], colors.surface]}
            style={{
              borderRadius: 26,
              padding: 30,
              minHeight: 340,
              borderWidth: 1,
              borderColor: colors.line,
              gap: 26,
              justifyContent: 'center',
            }}
          >
            <T muted style={{ fontSize: 10, letterSpacing: 1.5 }}>
              {document.title.toLocaleUpperCase('pt-BR')}
            </T>
            <T
              style={{
                fontFamily: fonts.semibold,
                fontSize: 29,
                lineHeight: 38,
                letterSpacing: -0.8,
              }}
            >
              {current.title}
            </T>
            {current.lines.map((line, index) => (
              <View key={index} style={[s.row, { alignItems: 'flex-start' }]}>
                <Icon name="circle" size={7} color={colors.primary} />
                <T style={{ flex: 1, fontSize: 16, lineHeight: 26 }}>{line}</T>
              </View>
            ))}
          </LinearGradient>
        </Reveal>
        <View style={[s.row, { justifyContent: 'space-between', flexWrap: 'wrap' }]}>
          <Button
            title="Slide anterior"
            small
            variant="secondary"
            icon="chevron-left"
            disabled={slide === 0}
            onPress={() => setSlide(slide - 1)}
          />
          <T accessibilityLiveRegion="polite">
            {slide + 1} / {blocks.length}
          </T>
          <Button
            title="Próximo slide"
            small
            variant="secondary"
            icon="chevron-right"
            disabled={slide >= blocks.length - 1}
            onPress={() => setSlide(slide + 1)}
          />
        </View>
      </View>
    );
  }
  return (
    <Card style={{ padding: 16, overflow: 'hidden' }}>
      <View style={[s.row, { justifyContent: 'space-between', flexWrap: 'wrap' }]}>
        <T muted style={{ fontSize: 11 }}>
          ARRASTE PARA EXPLORAR
        </T>
        <View style={s.row}>
          <Button
            title="Diminuir mapa"
            icon="minus"
            small
            variant="ghost"
            disabled={zoom <= 0.75}
            onPress={() => setZoom(Math.max(0.75, zoom - 0.25))}
          />
          <Button
            title="Ampliar mapa"
            icon="plus"
            small
            variant="ghost"
            disabled={zoom >= 1.5}
            onPress={() => setZoom(Math.min(1.5, zoom + 0.25))}
          />
        </View>
      </View>
      <ScrollView
        ref={mapRef}
        onLayout={(event) => setMapViewport(event.nativeEvent.layout.width)}
        onContentSizeChange={(width) =>
          mapRef.current?.scrollTo({ x: Math.max(0, (width - mapViewport) / 2), animated: false })
        }
        horizontal
        showsHorizontalScrollIndicator
        contentContainerStyle={{ paddingVertical: 28, paddingHorizontal: 8 }}
      >
        <View style={{ width: mapWidth, gap: 0 }}>
          <View
            style={{
              alignSelf: 'center',
              borderRadius: 16,
              padding: 18,
              backgroundColor: colors.lavender,
              maxWidth: 300 * zoom,
            }}
          >
            <T style={{ textAlign: 'center', fontFamily: fonts.semibold, fontSize: 15 * zoom }}>
              {document.title}
            </T>
          </View>
          <View
            style={{
              height: 30,
              width: 1,
              backgroundColor: colors.lavenderLine,
              alignSelf: 'center',
            }}
          />
          <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
            {blocks.map((block, index) => (
              <View
                key={index}
                style={{
                  flex: 1,
                  borderTopWidth: blocks.length > 1 ? 1 : 0,
                  borderColor: colors.lavenderLine,
                  alignItems: 'center',
                }}
              >
                <View style={{ height: 28, width: 1, backgroundColor: colors.lavenderLine }} />
                <View
                  style={{
                    borderRadius: 15,
                    backgroundColor: palette[index % palette.length],
                    padding: 15 * zoom,
                    width: '90%',
                    gap: 12,
                  }}
                >
                  <T
                    style={{ fontFamily: fonts.semibold, textAlign: 'center', fontSize: 13 * zoom }}
                  >
                    {block.title}
                  </T>
                  {block.lines.map((line, item) => (
                    <T key={item} style={{ fontSize: 11 * zoom, lineHeight: 19 * zoom }}>
                      {'• '}
                      {line}
                    </T>
                  ))}
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </Card>
  );
}
