import { View } from 'react-native';
import { router } from 'expo-router';
import { workspaceTools } from '@/constants/tools';
import { colors, fonts, themeTint } from '@/constants/theme';
import { Icon, T, s } from './ui';
import { Reveal, Touch } from './Motion';
import { useAvailableWidth } from '@/hooks/useAvailableWidth';

export function ToolGrid() {
  const width = useAvailableWidth();
  return (
    <View style={[s.grid, { gap: 12 }]}>
      {workspaceTools.map((tool) => (
        <Reveal
          key={tool.id}
          variant="inflate"
          style={{ flexBasis: width >= 900 ? '30%' : '46%', flexGrow: 1 }}
        >
          <Touch
            accessibilityRole="button"
            accessibilityLabel={`Explorar ${tool.label}`}
            onPress={() => router.push(tool.route)}
            style={{
              backgroundColor: themeTint(tool.color),
              padding: 20,
              borderRadius: 24,
              borderCurve: 'continuous',
              minHeight: 176,
              gap: 15,
              justifyContent: 'space-between',
              height: '100%',
            }}
          >
            <View style={[s.row, { justifyContent: 'space-between' }]}>
              <View style={{ backgroundColor: colors.surface, borderRadius: 13, padding: 10 }}>
                <Icon name={tool.icon} color={themeTint(tool.ink, '#B69AFF')} />
              </View>
              <Icon name="arrow-up-right" color={themeTint(tool.ink, '#B69AFF')} size={16} />
            </View>
            <View style={{ gap: 5 }}>
              <T
                style={{
                  fontSize: 15,
                  fontFamily: fonts.semibold,
                  color: themeTint(tool.ink, '#B69AFF'),
                }}
              >
                {tool.label}
              </T>
              <T style={{ fontSize: 11, lineHeight: 17, color: colors.muted }}>{tool.detail}</T>
            </View>
          </Touch>
        </Reveal>
      ))}
    </View>
  );
}
