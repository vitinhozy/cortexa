import { useWindowDimensions } from 'react-native';
import { useNavigationLayout } from './useNavigationLayout';

/** Largura real que sobra para o conteúdo quando a navegação lateral está aberta. */
export function useAvailableWidth() {
  const { width } = useWindowDimensions();
  const { layout, collapsed } = useNavigationLayout();
  if (width < 900 || layout !== 'left') return width;
  return Math.max(0, width - (collapsed ? 72 : 224));
}
