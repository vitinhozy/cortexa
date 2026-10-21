import { Pressable, Text } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { colors } from '@/constants/theme';
import { useNavigationLayout } from '@/hooks/useNavigationLayout';

export function NavigationLayoutToggle({
  compact = false,
  sidebar = false,
}: {
  compact?: boolean;
  sidebar?: boolean;
}) {
  const { layout, setLayout, collapsed, setCollapsed } = useNavigationLayout();
  const next = layout === 'left' ? 'bottom' : 'left';
  const nextLabel = next === 'left' ? 'à esquerda' : 'embaixo';
  const label = sidebar
    ? collapsed
      ? 'Expandir navegação lateral'
      : 'Recolher navegação lateral'
    : `Mover navegação ${nextLabel}`;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => (sidebar ? setCollapsed(!collapsed) : setLayout(next))}
      style={{
        minHeight: 38,
        minWidth: 38,
        paddingHorizontal: compact ? 0 : 11,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.line,
      }}
    >
      <Feather name="menu" size={16} color={colors.ink} />
      {!compact ? (
        <Text style={{ fontSize: 11, color: colors.ink }}>
          Navegação {layout === 'left' ? 'lateral' : 'inferior'}
        </Text>
      ) : null}
    </Pressable>
  );
}
