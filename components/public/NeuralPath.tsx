import { memo, useMemo } from 'react';
import { Animated, View } from 'react-native';

// Artistic anatomical accents, not a medical diagram or a change to the app palette.
const pathways = ['#D96377', '#477EE8'];

/** Short static curve segments grouped into animated bands: one shared scroll source. */
export const NeuralPath = memo(function NeuralPath({
  width,
  height,
  scrollY,
  reduced,
  compact,
  viewportHeight,
}: {
  width: number;
  height: number;
  scrollY: Animated.Value;
  reduced: boolean;
  compact: boolean;
  viewportHeight: number;
}) {
  const bands = useMemo(() => {
    const count = Math.ceil(height / 160);
    return Array.from({ length: count }, (_, band) =>
      pathways.map((color, strand) => {
        const point = (y: number) => ({
          x:
            width *
              (compact
                ? 0.045 + 0.023 * Math.sin(y / 230 + strand * 1.4)
                : 0.5 + 0.32 * Math.sin(y / 430 + strand * 0.45)) +
            strand * (compact ? 7 : 16),
          y,
        });
        return {
          color,
          top: band * 160,
          segments: Array.from({ length: 10 }, (_, step) => {
            const a = point(Math.min(height, band * 160 + step * 16));
            const b = point(Math.min(height, band * 160 + (step + 1) * 16));
            return {
              x: (a.x + b.x) / 2,
              y: (a.y + b.y) / 2 - band * 160,
              length: Math.hypot(b.x - a.x, b.y - a.y) + 0.8,
              angle: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI,
            };
          }),
        };
      }),
    );
  }, [compact, height, width]);
  return (
    <View
      pointerEvents="none"
      aria-hidden
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}
    >
      {bands.flatMap((strands, band) =>
        strands.map((strand, index) => (
          <Animated.View
            key={`${band}-${index}`}
            testID={`neural-band-${band}-${index}`}
            style={{
              position: 'absolute',
              top: strand.top,
              left: 0,
              width,
              height: 160,
              opacity: reduced
                ? 0.32
                : scrollY.interpolate({
                    inputRange: [
                      strand.top - viewportHeight * 0.9,
                      strand.top - viewportHeight * 0.55,
                      strand.top - viewportHeight * 0.15,
                    ],
                    outputRange: [0.06, 0.68, 0.32],
                    extrapolate: 'clamp',
                  }),
            }}
          >
            {strand.segments.map((segment, part) => (
              <View
                key={part}
                style={{
                  position: 'absolute',
                  left: segment.x - segment.length / 2,
                  top: segment.y,
                  width: segment.length,
                  height: compact ? 1 : 1.5,
                  borderRadius: 2,
                  backgroundColor: strand.color,
                  transform: [{ rotate: `${segment.angle}deg` }],
                }}
              />
            ))}
          </Animated.View>
        )),
      )}
    </View>
  );
});
